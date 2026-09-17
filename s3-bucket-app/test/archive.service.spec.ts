import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { uploadArchive, getLatestArchive, getArchiveUrlByName } from '../src/services/archive.service';

describe('archive.service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('uploadArchive', () => {
    it('envia o arquivo com o token de autorização e retorna os dados do upload', async () => {
      localStorage.setItem('token', 'meu-token');
      const responseBody = { name: 'arquivo.pdf', size: 100, ext: 'pdf', url: 'https://s3/arquivo.pdf' };
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => responseBody,
      });

      const file = new File(['conteudo'], 'arquivo.pdf', { type: 'application/pdf' });
      const result = await uploadArchive(file);

      expect(fetch).toHaveBeenCalledWith(
        '/api/upload',
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer meu-token' },
        })
      );
      expect(result).toEqual(responseBody);
    });

    it('lança um erro se a resposta do backend não for ok', async () => {
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        statusText: 'Payload Too Large',
      });

      const file = new File(['conteudo'], 'grande.pdf', { type: 'application/pdf' });

      await expect(uploadArchive(file)).rejects.toThrow('Erro ao enviar arquivo: Payload Too Large');
    });
  });

  describe('getLatestArchive', () => {
    it('retorna null sem chamar o backend se não houver token salvo', async () => {
      const result = await getLatestArchive();

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('retorna os dados do último arquivo quando a resposta é ok', async () => {
      localStorage.setItem('token', 'meu-token');
      const responseBody = { name: 'ultimo.pdf', size: 200, uploadedAt: '2026-01-01T10:00:00Z', url: 'https://s3/ultimo.pdf' };
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => responseBody,
      });

      const result = await getLatestArchive();

      expect(result).toEqual(responseBody);
    });

    it('remove o token e redireciona para o login se o backend retornar 401', async () => {
      localStorage.setItem('token', 'token-expirado');
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 401 });

      delete (window as any).location;
      (window as any).location = { href: '' };

      const result = await getLatestArchive();

      expect(result).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(window.location.href).toBe('http://localhost:3000/login');
    });

    it('retorna null se a chamada ao backend falhar por erro de rede', async () => {
      localStorage.setItem('token', 'meu-token');
      (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('network error'));

      const result = await getLatestArchive();

      expect(result).toBeNull();
    });
  });

  describe('getArchiveUrlByName', () => {
    it('retorna null sem chamar o backend se não houver token salvo', async () => {
      const result = await getArchiveUrlByName('arquivo.pdf');

      expect(result).toBeNull();
      expect(fetch).not.toHaveBeenCalled();
    });

    it('codifica o nome do arquivo na URL e retorna a url renovada', async () => {
      localStorage.setItem('token', 'meu-token');
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ url: 'https://s3/renovada.pdf' }),
      });

      const result = await getArchiveUrlByName('relatório final#1.pdf');

      expect(fetch).toHaveBeenCalledWith(
        `/api/upload/${encodeURIComponent('relatório final#1.pdf')}`,
        expect.objectContaining({ headers: { Authorization: 'Bearer meu-token' } })
      );
      expect(result).toBe('https://s3/renovada.pdf');
    });

    it('retorna null se a resposta não for ok', async () => {
      localStorage.setItem('token', 'meu-token');
      (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

      const result = await getArchiveUrlByName('arquivo.pdf');

      expect(result).toBeNull();
    });
  });
});
