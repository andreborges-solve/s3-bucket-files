import { Router } from 'express';
import type { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

const FRONT_URL = process.env.FRONT_URL ?? 'http://localhost:5173';

// instancia os serviços
const userService = new UserService();
const authService = new AuthService(userService);

const authRouter = Router();

// redireciona para a página de login da Genesys
authRouter.get('/login', (_req: Request, res: Response) => {
  try {
    const url = authService.generateLoginUrl();
    res.redirect(url);
  } catch {
    res.status(500).json({ message: 'Erro ao gerar URL de login' });
  }
});

// callback após autenticação na Genesys
authRouter.get('/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    const result = await authService.handleCallback(code, state);
    res.redirect(`${FRONT_URL}/auth/success?token=${result.token}`);
  } catch {
    res.status(401).json({ message: 'Falha na autenticação' });
  }
});

export default authRouter;
