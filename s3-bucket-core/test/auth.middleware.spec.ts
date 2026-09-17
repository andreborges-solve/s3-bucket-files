import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../src/auth/auth.middleware';

describe('authMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      method: 'GET',
      originalUrl: '/api/test',
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it('retorna 401 se o Authorization estiver ausente', () => {
    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 se o Authorization não começar com Bearer', () => {
    req.headers = { authorization: 'Basic 123456' };

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token não fornecido' });
    expect(next).not.toHaveBeenCalled();
  });

  it('retorna 401 se o token JWT for inválido ou expirado', () => {
    req.headers = { authorization: 'Bearer token_invalido' };

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Token inválido ou expirado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('valida token JWT legítimo, injeta req.user e chama next()', () => {
    const payload = { sub: '1', email: 'teste@dominio.com', displayName: 'Usuário Teste' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'chave_secreta_jwt');

    req.headers = { authorization: `Bearer ${token}` };

    authMiddleware(req as Request, res as Response, next);

    expect((req as any).user).toBeDefined();
    expect((req as any).user.email).toBe(payload.email);
    expect(next).toHaveBeenCalled();
  });

  it('retorna 500 se JWT_SECRET não estiver preenchido em prod', () => {
    jest.spyOn(console, 'error').mockImplementationOnce(() => { });
    const oldEnv = process.env.NODE_ENV;
    const oldSecret = process.env.JWT_SECRET;

    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    req.headers = { authorization: 'Bearer um_token_qualquer' };

    authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: 'Erro interno de configuração de segurança' });

    process.env.NODE_ENV = oldEnv;
    process.env.JWT_SECRET = oldSecret;
  });
});
