import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { postArchive, getArchive, getLastArchive, upload } from '../src/controllers/archive.controller';
import type { AuthenticatedRequest } from '../src/auth/auth.middleware';
import type { Response } from 'express';

const s3Mock = mockClient(S3Client);

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.mock.url/presigned-link'),
}));

describe('archive.controller', () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();

    req = {
      user: { sub: '1', email: 'autor@empresa.com', displayName: 'Autor Teste' },
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('postArchive', () => {
    it('retorna 400 se nenhum arquivo for fornecido no req.file', async () => {
      req.file = undefined;

      await postArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nenhum arquivo enviado' });
    });

    it('faz upload do arquivo no S3 e retorna o link temporário', async () => {
      req.file = {
        originalname: 'Relatório Final - Medição #1.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('conteudo teste'),
        size: 1024,
      } as any;

      s3Mock.on(PutObjectCommand).resolves({});

      await postArchive(req as AuthenticatedRequest, res as Response);

      expect(s3Mock.commandCalls(PutObjectCommand).length).toBe(1);
      const putCallArgs = s3Mock.commandCalls(PutObjectCommand)[0].args[0].input;
      expect(putCallArgs.Bucket).toBe(process.env.AWS_BUCKET_NAME);
      expect(putCallArgs.ContentType).toBe('application/pdf');

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.message).toBe('Arquivo enviado com sucesso');
      expect(jsonResponse.url).toBe('https://s3.mock.url/presigned-link');
      expect(jsonResponse.originalName).toBe('Relatório Final - Medição #1.pdf');
      expect(jsonResponse.name).toBeDefined();
    });

    it('retorna 500 se o upload no S3 der erro', async () => {
      jest.spyOn(console, 'error').mockImplementationOnce(() => { });
      req.file = {
        originalname: 'teste.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('conteudo'),
        size: 500,
      } as any;

      s3Mock.on(PutObjectCommand).rejects(new Error('Erro de conexão S3'));

      await postArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao enviar arquivo para o storage' });
    });
  });

  describe('getArchive', () => {
    it('retorna 400 se não passar o nome do arquivo', async () => {
      req.params = {};

      await getArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Nome do arquivo não fornecido' });
    });

    it('protege contra Path Traversal no nome do arquivo e retorna o link', async () => {
      req.params = { name: '../../etc/passwd' };

      await getArchive(req as AuthenticatedRequest, res as Response);

      expect(getSignedUrl).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ url: 'https://s3.mock.url/presigned-link' });
    });

    it('retorna 404 se o arquivo não for encontrado no S3', async () => {
      req.params = { name: 'arquivo.pdf' };
      (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('Chave não encontrada'));

      await getArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Arquivo não encontrado' });
    });
  });

  describe('getLastArchive', () => {
    it('retorna null se o bucket estiver vazio', async () => {
      s3Mock.on(ListObjectsV2Command).resolves({ Contents: [] });

      await getLastArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(null);
    });

    it('retorna o arquivo mais recente enviado', async () => {
      const dataAntiga = new Date('2026-01-01T10:00:00Z');
      const dataRecente = new Date('2026-09-01T10:00:00Z');

      s3Mock.on(ListObjectsV2Command).resolves({
        Contents: [
          { Key: 'antigo.pdf', LastModified: dataAntiga, Size: 100 },
          { Key: 'recente.pdf', LastModified: dataRecente, Size: 200 },
        ],
      });

      await getLastArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      const jsonResponse = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonResponse.name).toBe('recente.pdf');
      expect(jsonResponse.size).toBe(200);
      expect(jsonResponse.url).toBe('https://s3.mock.url/presigned-link');
    });

    it('retorna 500 se der erro ao listar arquivos do bucket', async () => {
      jest.spyOn(console, 'error').mockImplementationOnce(() => { });
      s3Mock.on(ListObjectsV2Command).rejects(new Error('Erro de permissão no S3'));

      await getLastArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao buscar o último arquivo do bucket' });
    });
  });

  describe('upload (multer fileFilter)', () => {
    it('aceita arquivos permitidos como PDF', () => {
      const fileFilter = (upload as any).fileFilter;
      const cb = jest.fn();

      fileFilter(null, { mimetype: 'application/pdf' }, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('bloqueia arquivos não permitidos como EXE', () => {
      const fileFilter = (upload as any).fileFilter;
      const cb = jest.fn();

      fileFilter(null, { mimetype: 'application/x-msdownload' }, cb);

      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
