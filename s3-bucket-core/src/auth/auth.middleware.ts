import * as jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  sub: string;
  email: string;
  displayName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// middleware que valida o JWT e injeta o usuário no req
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log(`Auth Falha - token não fornecido | ${req.method} ${req.originalUrl}`);
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'chave_secreta_jwt') as AuthenticatedUser;
    (req as AuthenticatedRequest).user = payload;
    console.log(`Auth - feita com Sucesso - ${payload.email} acessou ${req.method} ${req.originalUrl}`);
    next();
  } catch {
    console.log(`Auth - Falha - token inválido/expirado | ${req.method} ${req.originalUrl}`);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
