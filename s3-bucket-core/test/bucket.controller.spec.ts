import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { cleanExpiredBucketFiles } from '../src/controllers/bucket.controller';

const s3Mock = mockClient(S3Client);

jest.mock('../src/services/archive.service', () => ({
  buscarArquivosExpirados: jest.fn(),
  removerArquivosPorIds: jest.fn().mockResolvedValue(1),
}));

describe('bucket.controller - cleanExpiredBucketFiles', () => {
  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  it('retorna deletedCount 0 se o bucket estiver vazio', async () => {
    const { buscarArquivosExpirados } = jest.requireMock('../src/services/archive.service');
    buscarArquivosExpirados.mockResolvedValueOnce([]);

    const result = await cleanExpiredBucketFiles();

    expect(result).toEqual({ deletedCount: 0, files: [] });
    expect(s3Mock.commandCalls(DeleteObjectsCommand).length).toBe(0);
  });

  it('não deleta arquivos com menos de 30 dias', async () => {
    const { buscarArquivosExpirados } = jest.requireMock('../src/services/archive.service');
    buscarArquivosExpirados.mockResolvedValueOnce([]);

    const result = await cleanExpiredBucketFiles();

    expect(result).toEqual({ deletedCount: 0, files: [] });
    expect(s3Mock.commandCalls(DeleteObjectsCommand).length).toBe(0);
  });

  it('deleta arquivos com mais de 30 dias', async () => {
    const { buscarArquivosExpirados, removerArquivosPorIds } = jest.requireMock('../src/services/archive.service');
    buscarArquivosExpirados.mockResolvedValueOnce([
      {
        id_ficha: 10,
        uploaded_by: 'autor@empresa.com',
        filename: 'relatorio-antigo.pdf',
        s3_key: 'relatorio-antigo.pdf',
        file_size: 500,
      },
    ]);

    s3Mock.on(DeleteObjectsCommand).resolves({});

    const result = await cleanExpiredBucketFiles();

    expect(result.deletedCount).toBe(1);
    expect(result.files).toContain('relatorio-antigo.pdf');
    expect(s3Mock.commandCalls(DeleteObjectsCommand).length).toBe(1);
    expect(removerArquivosPorIds).toHaveBeenCalledWith([10]);
  });
});
