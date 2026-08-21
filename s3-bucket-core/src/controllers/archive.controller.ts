import multer from 'multer';
import type { Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware';

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
const EXPIRES_IN = parseInt(process.env.PRESIGNED_URL_EXPIRES_IN ?? '300');

// memoryStorage para ter acesso ao file.buffer e enviar pro S3
export const upload = multer({ storage: multer.memoryStorage() });

// recebe o arquivo, envia pro bucket e retorna a presigned URL
export const postArchive = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const usuarioLogado = req.user;

  if (!file) {
    res.status(400).json({ message: 'Nenhum arquivo enviado' });
    return;
  }

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: file.originalname }),
      { expiresIn: EXPIRES_IN }
    );

    console.log({
      message: 'Arquivo salvo com sucesso',
      name: file.originalname,
      size: file.size,
      enviadoPor: usuarioLogado?.email,
    });

    res.status(200).json({
      message: 'Arquivo enviado com sucesso',
      url: fileUrl,
      name: file.originalname,
      size: file.size,
      enviadoPor: usuarioLogado?.email,
    });
  } catch (error) {
    console.error('Erro no upload S3:', error);
    res.status(500).json({ message: 'Erro ao enviar arquivo para o storage' });
  }
};

// gera uma presigned URL para acesso ao arquivo pelo nome
export const getArchive = async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).json({ message: 'Nome do arquivo não fornecido' });
    return;
  }

  try {
    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: name }),
      { expiresIn: EXPIRES_IN }
    );

    console.log({
      name,
      acessadoEm: new Date().toLocaleString('pt-BR'),
      acessadoPor: req.user?.email,
    });

    res.status(200).json({ url: fileUrl });
  } catch (error) {
    res.status(404).json({ message: 'Arquivo não encontrado' });
  }
};
