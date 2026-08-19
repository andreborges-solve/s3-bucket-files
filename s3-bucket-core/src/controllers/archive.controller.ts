import path from 'path';
import fs from 'fs';
import multer from 'multer';
import type { Request, Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

// memoryStorage para ter acesso ao file.buffer e enviar pro S3
export const upload = multer({ storage: multer.memoryStorage() });

export const postArchive = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: 'Nenhum arquivo enviado' });
    return;
  }

  try {
    // envia o arquivo pro bucket
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: file.originalname,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await s3Client.send(uploadCommand);

    // gera presigned URL com 5 minutos de expiração
    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: file.originalname });
    const fileUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 300 });

    console.log({
      message: 'Arquivo salvo com sucesso',
      name: file.originalname,
      size: file.size,
      url: fileUrl,
    });

    res.status(200).json({
      message: 'Arquivo salvo com sucesso',
      url: fileUrl,
      name: file.originalname,
      size: file.size,
    });
  } catch (error) {
    console.error('Erro no upload S3:', error);
    res.status(500).json({ message: 'Erro ao enviar arquivo para o storage' });
  }
};

// getArchive
export const getArchive = async (req: Request, res: Response) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).json({ message: 'Nome do arquivo não fornecido' });
    return;
  }

  const filePath = path.join(process.env.LOCAL_STORAGE_PATH ?? '', name);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: 'Arquivo não encontrado' });
    return;
  }

  console.log({
    name,
    size: fs.statSync(filePath).size,
    acessadoEm: new Date().toLocaleString('pt-BR'),
  });

  res.sendFile(filePath);
};