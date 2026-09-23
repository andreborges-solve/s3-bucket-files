import express from 'express';
import request from 'supertest';

const mockGenerateLoginUrl = jest.fn();
const mockHandleCallback = jest.fn();

jest.mock('../src/auth/auth.service', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    generateLoginUrl: (...args: unknown[]) => mockGenerateLoginUrl(...args),
    handleCallback: (...args: unknown[]) => mockHandleCallback(...args),
  })),
}));

import authRouter from '../src/auth/auth.controller';

describe('auth.controller', () => {
  const app = express();
  app.use(authRouter);

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => { });
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('redireciona /login para a URL PKCE da Genesys', async () => {
    mockGenerateLoginUrl.mockReturnValue('https://login.sae1.pure.cloud/oauth/authorize?state=abc');

    const response = await request(app).get('/login');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('https://login.sae1.pure.cloud/oauth/authorize?state=abc');
  });

  it('responde 500 se não conseguir gerar a URL de login', async () => {
    mockGenerateLoginUrl.mockImplementation(() => {
      throw new Error('falha ao montar PKCE');
    });

    const response = await request(app).get('/login');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ message: 'Erro ao gerar URL de login' });
  });

  it('redireciona /logout para o logout da Genesys', async () => {
    const response = await request(app).get('/logout');

    expect(response.status).toBe(302);
    expect(response.headers.location).toBe(
      'https://login.sae1.pure.cloud/logout?client_id=test-client-id&redirect_uri=http%3A%2F%2Flocalhost'
    );
  });

  it('redireciona o callback com o JWT no fragmento da URL', async () => {
    mockHandleCallback.mockResolvedValue({ token: 'jwt-da-sessao', user: { email: 'user@genesys.com' } });

    const response = await request(app).get('/oauth/callback').query({ code: 'code-ok', state: 'state-ok' });

    expect(mockHandleCallback).toHaveBeenCalledWith('code-ok', 'state-ok');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('http://localhost#token=jwt-da-sessao');
  });

  it('responde 401 quando o callback da Genesys falha', async () => {
    mockHandleCallback.mockRejectedValue(new Error('State inválido ou expirado'));

    const response = await request(app).get('/oauth/callback').query({ code: 'code-ruim', state: 'state-ruim' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ message: 'Falha na autenticação' });
  });
});
