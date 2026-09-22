import { describe, it, expect } from 'vitest';
import { parseTokenData } from '../src/utils/token';

function buildToken(payload: object): string {
  const base64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${base64}.signature`;
}

describe('parseTokenData', () => {
  it('retorna email nulo e token expirado se o token for nulo', () => {
    expect(parseTokenData(null)).toEqual({ email: null, isExpired: true });
  });

  it('retorna token expirado se o token não for um JWT válido', () => {
    expect(parseTokenData('token-invalido-sem-payload')).toEqual({ email: null, isExpired: true });
  });

  it('retorna token expirado se o payload não for um JSON válido', () => {
    const payloadInvalido = 'nao-e-base64-json-valido!!!';
    expect(parseTokenData(`header.${payloadInvalido}.signature`)).toEqual({ email: null, isExpired: true });
  });

  it('extrai o email do token válido e não expirado', () => {
    const expNoFuturo = Math.floor(Date.now() / 1000) + 3600;
    const token = buildToken({ email: 'user@empresa.com', exp: expNoFuturo });

    expect(parseTokenData(token)).toEqual({ email: 'user@empresa.com', isExpired: false });
  });

  it('marca o token como expirado se o exp estiver no passado', () => {
    const expNoPassado = Math.floor(Date.now() / 1000) - 3600;
    const token = buildToken({ email: 'user@empresa.com', exp: expNoPassado });

    expect(parseTokenData(token)).toEqual({ email: 'user@empresa.com', isExpired: true });
  });

  it('considera o token válido se o payload não tiver campo exp', () => {
    const token = buildToken({ email: 'sem-exp@empresa.com' });

    expect(parseTokenData(token)).toEqual({ email: 'sem-exp@empresa.com', isExpired: false });
  });
});
