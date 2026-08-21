import axios from 'axios';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';
import type { UserService } from '../user/user.service';

export class AuthService {
  private pkceStore = new Map<string, { verifier: string; expiresAt: number }>();

  private readonly region = process.env.GENESYS_REGION ?? 'sae1.pure.cloud';
  private readonly clientId = process.env.GENESYS_CLIENT_ID ?? '';
  private readonly redirectUri = process.env.GENESYS_OAUTH_REDIRECT_URI ?? '';

  constructor(private readonly userService: UserService) {}

  // gera URL de login com desafio PKCE
  generateLoginUrl(): string {
    const state = crypto.randomBytes(16).toString('hex');
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');

    // guarda o verifier por 10 minutos
    this.pkceStore.set(state, {
      verifier,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256',
    });

    return `https://login.${this.region}/oauth/authorize?${params.toString()}`;
  }

  // processa o callback, valida PKCE e autentica o usuário
  async handleCallback(code: string, state: string) {
    const pkce = this.pkceStore.get(state);
    if (!pkce || pkce.expiresAt <= Date.now()) {
      this.pkceStore.delete(state);
      throw new Error('State inválido ou expirado');
    }

    const codeVerifier = pkce.verifier;
    this.pkceStore.delete(state);

    try {
      // troca o code pelo token na Genesys
      const tokenRes = await axios.post(
        `https://login.${this.region}/oauth/token`,
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          code_verifier: codeVerifier,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const genesysToken = tokenRes.data.access_token;

      // busca os dados do usuário autenticado na Genesys
      const userRes = await axios.get(`https://api.${this.region}/api/v2/users/me`, {
        headers: { Authorization: `Bearer ${genesysToken}` },
      });

      const profile = userRes.data;

      // salva ou recupera o usuário
      const user = await this.userService.findOrCreateExternalUser({
        email: profile.email,
        externalId: profile.id,
        authProvider: 'genesys',
        displayName: profile.name || profile.username,
      });

      // emite o JWT da aplicação
      const token = jwt.sign(
        { sub: user.id, email: user.email, displayName: user.displayName },
        process.env.JWT_SECRET ?? 'chave_secreta_jwt',
        { expiresIn: '8h' },
      );

      return { token, user };
    } catch {
      throw new Error('Erro ao autenticar com Genesys Cloud');
    }
  }
}
