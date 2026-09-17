import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { cleanExpiredBucketFiles } from '../src/controllers/bucket.controller';

const s3Mock = mockClient(S3Client);

describe('bucket.controller - cleanExpiredBucketFiles', () => {
  beforeEach(() => {
    s3Mock.reset();
  });

  it('retorna deletedCount 0 se o bucket estiver vazio', async () => {
    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [],
      IsTruncated: false,
    });

    const result = await cleanExpiredBucketFiles();

    expect(result).toEqual({ deletedCount: 0, files: [] });
    expect(s3Mock.commandCalls(DeleteObjectsCommand).length).toBe(0);
  });

  it('não deleta arquivos com menos de 30 dias', async () => {
    const recentDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 dias atrás

    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'relatorio-recente.pdf', LastModified: recentDate }],
      IsTruncated: false,
    });

    const result = await cleanExpiredBucketFiles();

    expect(result).toEqual({ deletedCount: 0, files: [] });
    expect(s3Mock.commandCalls(DeleteObjectsCommand).length).toBe(0);
  });

  it('deleta arquivos com mais de 30 dias', async () => {
    const expiredDate = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000); // 40 dias atrás

    s3Mock.on(ListObjectsV2Command).resolves({
      Contents: [{ Key: 'relatorio-antigo.pdf', LastModified: expiredDate }],
      IsTruncated: false,
    });

    s3Mock.on(DeleteObjectsCommand).resolves({});

    const result = await cleanExpiredBucketFiles();

    expect(result.deletedCount).toBe(1);
    expect(result.files).toBeDefined();
    expect(result.files).toContain('relatorio-antigo.pdf');
    expect(s3Mock.commandCalls(DeleteObjectsCommand).length).toBe(1);
  });

  it('suporta paginação ao varrer arquivos expirados', async () => {
    const expiredDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);

    s3Mock
      .on(ListObjectsV2Command)
      .resolvesOnce({
        Contents: [{ Key: 'pag1-antigo.pdf', LastModified: expiredDate }],
        IsTruncated: true,
        NextContinuationToken: 'token-page-2',
      })
      .resolvesOnce({
        Contents: [{ Key: 'pag2-antigo.pdf', LastModified: expiredDate }],
        IsTruncated: false,
      });

    s3Mock.on(DeleteObjectsCommand).resolves({});

    const result = await cleanExpiredBucketFiles();

    expect(result.deletedCount).toBe(2);
    expect(result.files).toContain('pag1-antigo.pdf');
    expect(result.files).toContain('pag2-antigo.pdf');
  });
});
