import axios from 'axios';
import jwt from 'jsonwebtoken';
import { AuthService } from '../src/auth/auth.service';
import type { UserService } from '../src/user/user.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserService: Partial<UserService>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserService = {
      findOrCreateExternalUser: jest.fn().mockResolvedValue({
        id: 10,
        email: 'user@genesys.com',
        externalId: 'genesys-id-123',
        authProvider: 'genesys',
        displayName: 'Genesys User',
        createdAt: new Date(),
      }),
    };
    authService = new AuthService(mockUserService as UserService);
  });

  it('gera URL de login PKCE com os parâmetros corretos', () => {
    const url = authService.generateLoginUrl();

    expect(url).toContain('https://login.');
    expect(url).toContain('response_type=code');
    expect(url).toContain('client_id=');
    expect(url).toContain('code_challenge=');
    expect(url).toContain('code_challenge_method=S256');
  });

  it('rejeita o callback se o state for inválido ou inexistente', async () => {
    await expect(authService.handleCallback('code-123', 'state-invalido')).rejects.toThrow(
      'State inválido ou expirado'
    );
  });

  it('processa o callback do PKCE com sucesso e retorna o JWT e dados do usuário', async () => {
    const loginUrl = authService.generateLoginUrl();
    const urlParams = new URLSearchParams(loginUrl.split('?')[1]);
    const validState = urlParams.get('state')!;

    mockedAxios.post.mockResolvedValueOnce({
      data: { access_token: 'genesys-access-token-999' },
    });

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        id: 'genesys-id-123',
        email: 'user@genesys.com',
        name: 'Genesys User',
      },
    });

    const result = await authService.handleCallback('valid-code', validState);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockUserService.findOrCreateExternalUser).toHaveBeenCalledWith({
      email: 'user@genesys.com',
      externalId: 'genesys-id-123',
      authProvider: 'genesys',
      displayName: 'Genesys User',
    });

    expect(result.token).toBeDefined();
    const decoded: any = jwt.verify(result.token, process.env.JWT_SECRET || 'chave_secreta_jwt');
    expect(decoded.email).toBe('user@genesys.com');
    expect(decoded.sub).toBe(10);
  });

  it('captura falhas da requisição e relança erro', async () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => { });
    const loginUrl = authService.generateLoginUrl();
    const urlParams = new URLSearchParams(loginUrl.split('?')[1]);
    const validState = urlParams.get('state')!;

    mockedAxios.post.mockRejectedValueOnce(new Error('Erro de conexão Genesys'));

    await expect(authService.handleCallback('code', validState)).rejects.toThrow(
      'Erro ao autenticar com Genesys Cloud'
    );
  });
});
