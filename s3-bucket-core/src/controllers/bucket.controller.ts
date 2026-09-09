import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_URL,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = process.env.AWS_BUCKET_NAME ?? '';
const RETENTION_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Rotina que faz a varredura e deleta qualquer arquivo com mais de 30 dias
export async function cleanExpiredBucketFiles() {
  if (!BUCKET_NAME) {
    console.log('[Bucket Cleanup] AWS_BUCKET_NAME não definido.');
    return { deletedCount: 0, files: [] };
  }

  const cutoffDate = Date.now() - RETENTION_DAYS * MS_PER_DAY;

  try {
    const listResponse = await s3Client.send(
      new ListObjectsV2Command({ Bucket: BUCKET_NAME })
    );

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return { deletedCount: 0, files: [] };
    }

    const expiredFiles = listResponse.Contents.filter((item) => {
      if (!item.LastModified) return false;
      return new Date(item.LastModified).getTime() < cutoffDate;
    });

    if (expiredFiles.length === 0) {
      return { deletedCount: 0, files: [] };
    }

    const objectsToDelete = expiredFiles
      .filter((item) => Boolean(item.Key))
      .map((item) => ({ Key: item.Key! }));

    await s3Client.send(
      new DeleteObjectsCommand({
        Bucket: BUCKET_NAME,
        Delete: { Objects: objectsToDelete },
      })
    );

    const deletedNames = objectsToDelete.map((o) => o.Key);
    console.log(
      `[Bucket Cleanup] ${deletedNames.length} arquivo(s) com mais de ${RETENTION_DAYS} dias foram removidos:`,
      deletedNames
    );

    return { deletedCount: deletedNames.length, files: deletedNames };
  } catch (error) {
    console.error('[Bucket Cleanup] Erro ao limpar arquivos expirados:', error);
    throw error;
  }
}
