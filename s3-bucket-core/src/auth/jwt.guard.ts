import * as jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// middleware que valida o JWT e injeta o usuário no req
export function jwtAuthGuard(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token não fornecido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'chave_secreta_jwt');
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}
