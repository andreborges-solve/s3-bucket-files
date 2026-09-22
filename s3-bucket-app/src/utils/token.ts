// extrai o payload e valida se o JWT está expirado
export function parseTokenData(token: string | null): { email: string | null; isExpired: boolean } {
  if (!token) return { email: null, isExpired: true };
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return { email: null, isExpired: true };
    const jsonStr = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(jsonStr);

    // verifica se o token expirou
    const isExpired = Boolean(data.exp && data.exp * 1000 < Date.now());
    return { email: data.email || null, isExpired };
  } catch {
    return { email: null, isExpired: true };
  }
}
