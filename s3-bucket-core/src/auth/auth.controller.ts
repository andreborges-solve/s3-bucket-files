import { Router } from 'express';
import type { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

const FRONT_URL = process.env.FRONT_URL ?? 'http://localhost';

// instancia os serviços
const userService = new UserService();
const authService = new AuthService(userService);

const authRouter = Router();

// redireciona para a página de login da Genesys
authRouter.get('/login', (_req: Request, res: Response) => {
  try {
    const url = authService.generateLoginUrl();
    console.log('[Auth] Redirecionando para login Genesys:', url);
    res.redirect(url);
  } catch (err) {
    console.error('[Auth] Erro ao gerar URL de login:', err);
    res.status(500).json({ message: 'Erro ao gerar URL de login' });
  }
});

// rota para fazer o logout na Genesys
authRouter.get('/logout', (_req: Request, res: Response) => {
  const region = process.env.GENESYS_REGION ?? 'sae1.pure.cloud';
  const clientId = process.env.GENESYS_CLIENT_ID ?? '';
  const redirectUri = encodeURIComponent(FRONT_URL);

  // URL oficial de logout da Genesys
  const logoutUrl = `https://login.${region}/logout?client_id=${clientId}&redirect_uri=${redirectUri}`;
  console.log('[Auth] Redirecionando para logout Genesys:', logoutUrl);
  res.redirect(logoutUrl);
});

// callback após autenticação na Genesys
authRouter.get('/oauth/callback', async (req: Request, res: Response) => {
  try {
    const { code, state } = req.query as { code: string; state: string };
    console.log('[Auth] Recebido callback do Genesys. Code presente:', !!code, 'State:', state);
    const result = await authService.handleCallback(code, state);
    const dest = `${FRONT_URL}?token=${result.token}`;
    console.log('[Auth] Autenticado com sucesso! Redirecionando para:', dest);
    res.redirect(dest);
  } catch (err: any) {
    console.error('[Auth] Falha no callback OAuth:', err?.response?.data || err?.message || err);
    res.status(401).json({ message: 'Falha na autenticação', error: err?.message });
  }
});

export default authRouter;