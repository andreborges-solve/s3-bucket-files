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
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: JWT_SECRET não está definido nas variáveis de ambiente!');
      res.status(500).json({ message: 'Erro interno de configuração de segurança' });
      return;
    }
  }

  const jwtSecret = secret || 'chave_secreta_jwt';

  try {
    const payload = jwt.verify(token, jwtSecret) as AuthenticatedUser;
    (req as AuthenticatedRequest).user = payload;
    console.log(`Auth - feita com Sucesso - ${payload.email} acessou ${req.method} ${req.originalUrl}`);
    next();
  } catch {
    console.log(`Auth - Falha - token inválido/expirado | ${req.method} ${req.originalUrl}`);
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
