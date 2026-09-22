import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../src/App';
import * as archiveService from '../src/services/archive.service';

vi.mock('../src/services/archive.service');
vi.mocked(archiveService.getLatestArchive).mockResolvedValue(null);

function buildToken(payload: object): string {
  const base64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${base64}.signature`;
}

describe('App - autenticação', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(archiveService.getLatestArchive).mockResolvedValue(null);
  });

  it('redireciona para o login se não houver token salvo nem token na URL', async () => {
    delete (window as any).location;
    (window as any).location = { href: '', hash: '', search: '' };

    render(<App />);

    await waitFor(() => expect(window.location.href).toBe('/login'));
  });

  it('salva o token recebido no fragment da URL e exibe o usuário autenticado', async () => {
    const expNoFuturo = Math.floor(Date.now() / 1000) + 3600;
    const token = buildToken({ email: 'usuario@empresa.com', exp: expNoFuturo });

    delete (window as any).location;
    (window as any).location = { href: '', hash: `#token=${token}`, search: '' };
    window.history.replaceState = vi.fn();

    render(<App />);

    expect(await screen.findByText(/Usuário autenticado: usuario@empresa.com/i)).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe(token);
    expect(window.history.replaceState).toHaveBeenCalledWith({}, '', '/');
  });

  it('descarta o token expirado salvo e redireciona para o login', async () => {
    const expNoPassado = Math.floor(Date.now() / 1000) - 3600;
    const tokenExpirado = buildToken({ email: 'usuario@empresa.com', exp: expNoPassado });
    localStorage.setItem('token', tokenExpirado);

    delete (window as any).location;
    (window as any).location = { href: '', hash: '', search: '' };

    render(<App />);

    await waitFor(() => expect(window.location.href).toBe('/login'));
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('renderiza a tela principal de gerenciamento de arquivos quando o token salvo é válido', async () => {
    const expNoFuturo = Math.floor(Date.now() / 1000) + 3600;
    const token = buildToken({ email: 'usuario@empresa.com', exp: expNoFuturo });
    localStorage.setItem('token', token);

    delete (window as any).location;
    (window as any).location = { href: '', hash: '', search: '' };

    render(<App />);

    expect(await screen.findByText('Carregar arquivo')).toBeInTheDocument();
  });
});
