import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { buscarArquivosExpirados, removerArquivosPorIds } from '../services/archive.service';

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

// rotina de consulta no banco os arquivos com expires_at <= NOW(), deleta no S3 e remove do banco
export async function cleanExpiredBucketFiles() {
  if (!BUCKET_NAME) {
    console.log('[Bucket Cleanup] AWS_BUCKET_NAME não definido.');
    return { deletedCount: 0, files: [] };
  }

  try {
    const expiredFiles = await buscarArquivosExpirados();

    if (!expiredFiles || expiredFiles.length === 0) {
      return { deletedCount: 0, files: [] };
    }

    const objectsToDelete = expiredFiles
      .filter((item) => Boolean(item.s3_key))
      .map((item) => ({ Key: item.s3_key }));

    if (objectsToDelete.length > 0) {
      await s3Client.send(
        new DeleteObjectsCommand({
          Bucket: BUCKET_NAME,
          Delete: { Objects: objectsToDelete },
        })
      );
    }

    const idsToDelete = expiredFiles
      .filter((item) => item.id_ficha !== undefined)
      .map((item) => item.id_ficha!);

    await removerArquivosPorIds(idsToDelete);

    const deletedNames = objectsToDelete.map((o) => o.Key);
    console.log(
      `[Bucket Cleanup] ${deletedNames.length} arquivo(s) expirados foram removidos do S3 e do banco:`,
      deletedNames
    );

    return { deletedCount: deletedNames.length, files: deletedNames };
  } catch (error) {
    console.error('[Bucket Cleanup] Erro ao limpar arquivos expirados:', error);
    throw error;
  }
}
