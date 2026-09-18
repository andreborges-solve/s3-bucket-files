import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { postArchive, getArchive, getLastArchive, upload } from '../src/controllers/archive.controller';
import type { AuthenticatedRequest } from '../src/auth/auth.middleware';
import type { Response } from 'express';

const s3Mock = mockClient(S3Client);

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn().mockResolvedValue('https://s3.mock.url/presigned-link'),
}));

jest.mock('../src/services/archive.service', () => ({
  salvarArquivo: jest.fn().mockResolvedValue({
    id_ficha: 1,
    uploaded_by: 'autor@empresa.com',
    filename: 'Relatório Final - Medição #1.pdf',
    s3_key: 'mock-s3-key',
    file_size: 1024,
    created_at: new Date('2026-09-01T10:00:00Z'),
    expires_at: new Date('2026-10-01T10:00:00Z'),
  }),
  buscarUltimoArquivo: jest.fn().mockResolvedValue({
    id_ficha: 1,
    uploaded_by: 'autor@empresa.com',
    filename: 'recente.pdf',
    s3_key: 'recente.pdf',
    file_size: 200,
    created_at: new Date('2026-09-01T10:00:00Z'),
    expires_at: new Date('2026-10-01T10:00:00Z'),
  }),
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

    it('faz rollback e remove o arquivo do S3 se a gravação no banco falhar', async () => {
      jest.spyOn(console, 'error').mockImplementationOnce(() => { });
      jest.spyOn(console, 'warn').mockImplementationOnce(() => { });

      req.file = {
        originalname: 'rollback.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('conteudo'),
        size: 500,
      } as any;

      s3Mock.on(PutObjectCommand).resolves({});
      s3Mock.on(DeleteObjectCommand).resolves({});

      const { salvarArquivo } = jest.requireMock('../src/services/archive.service');
      salvarArquivo.mockRejectedValueOnce(new Error('Falha no PostgreSQL'));

      await postArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(s3Mock.commandCalls(PutObjectCommand).length).toBe(1);
      expect(s3Mock.commandCalls(DeleteObjectCommand).length).toBe(1);
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
      const { buscarUltimoArquivo } = jest.requireMock('../src/services/archive.service');
      buscarUltimoArquivo.mockResolvedValueOnce(null);

      await getLastArchive(req as AuthenticatedRequest, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(null);
    });

    it('retorna o arquivo mais recente enviado', async () => {
      const { buscarUltimoArquivo } = jest.requireMock('../src/services/archive.service');
      buscarUltimoArquivo.mockResolvedValueOnce({
        id_ficha: 1,
        uploaded_by: 'autor@empresa.com',
        filename: 'recente.pdf',
        s3_key: 'recente.pdf',
        file_size: 200,
        created_at: new Date('2026-09-01T10:00:00Z'),
        expires_at: new Date('2026-10-01T10:00:00Z'),
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
      const { buscarUltimoArquivo } = jest.requireMock('../src/services/archive.service');
      buscarUltimoArquivo.mockRejectedValueOnce(new Error('Erro de conexão com o banco'));

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
