import express from 'express';
import request from 'supertest';
import archiveRouter from '../src/routes/archive.routes';
import { upload } from '../src/controllers/archive.controller';

jest.mock('../src/auth/auth.middleware', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.user = { sub: '1', email: 'autor@empresa.com', displayName: 'Autor' };
    next();
  },
}));

describe('archive.routes - limite de upload', () => {
  const app = express();
  app.use('/api', archiveRouter);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('configura o multer com limite de 120MB', () => {
    expect((upload as any).limits.fileSize).toBe(120 * 1024 * 1024);
  });

  it('responde 400 quando o arquivo excede 120MB', async () => {
    jest.spyOn(upload, 'single').mockReturnValue((_req, _res, cb) => {
      const erro = new Error('File too large') as Error & { code?: string };
      erro.code = 'LIMIT_FILE_SIZE';
      cb(erro);
    });

    const response = await request(app).post('/api/upload');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'O arquivo enviado excede o limite máximo permitido de 120MB.',
    });
  });

  it('responde 400 com a mensagem do multer para outros erros de upload', async () => {
    jest.spyOn(upload, 'single').mockReturnValue((_req, _res, cb) => {
      cb(new Error('Tipo de arquivo não suportado. Envie apenas PDF, Imagens, Excel, Word, CSV ou TXT.'));
    });

    const response = await request(app).post('/api/upload');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: 'Erro no upload de arquivo: Tipo de arquivo não suportado. Envie apenas PDF, Imagens, Excel, Word, CSV ou TXT.',
    });
  });
});
