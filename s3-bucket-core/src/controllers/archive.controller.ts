import multer from 'multer';
import path from 'path';
import type { Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AuthenticatedRequest } from '../auth/auth.middleware';

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
const EXPIRES_IN = parseInt(process.env.PRESIGNED_URL_EXPIRES_IN ?? '300', 10);

//tipos de arquivos permitidos pra upload
const ALLOWED_MIME_TYPES = [
  // Documentos e Textos
  'application/pdf',
  'text/plain',
  'text/csv',

  // Microsoft Office
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel', // .xls
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  // imagens
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/tiff', // digitalização de documentos
  //.zip
  'application/zip',
];

// memoryStorage com limites de tamanho de arquivo max 50MB e filtro de extensão
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Envie apenas PDF, Imagens, Excel, Word, CSV ou TXT.'));
    }
  },
});

// recebe o arquivo, envia pro bucket e retorna a presigned URL
export const postArchive = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const usuarioLogado = req.user;

  if (!file) {
    res.status(400).json({ message: 'Nenhum arquivo enviado' });
    return;
  }

  // Sanitiza acentos, espaços e caracteres especiais do nome original
  const normalizedName = file.originalname
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  const sanitizedOriginalName = path.basename(normalizedName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueKey = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${sanitizedOriginalName}`;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const originalName = file.originalname;
    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: uniqueKey,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(originalName)}"`,
      }),
      { expiresIn: EXPIRES_IN }
    );

    console.log({
      message: 'Arquivo salvo com sucesso',
      key: uniqueKey,
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

// gera uma presigned URL para acesso ao arquivo pelo nome (sanitizando contra path traversal)
export const getArchive = async (req: AuthenticatedRequest, res: Response) => {
  const { name } = req.params;

  if (!name) {
    res.status(400).json({ message: 'Nome do arquivo não fornecido' });
    return;
  }

  // Previne path traversal atacando o parâmetro de nome do arquivo
  const safeKey = path.basename(name);
  const displayName = safeKey.includes('-') ? safeKey.split('-').slice(2).join('-') : safeKey;

  try {
    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: safeKey,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(displayName)}"`,
      }),
      { expiresIn: EXPIRES_IN }
    );

    console.log({
      name: safeKey,
      acessadoEm: new Date().toLocaleString('pt-BR'),
      acessadoPor: req.user?.email,
    });

    res.status(200).json({ url: fileUrl });
  } catch (error) {
    res.status(404).json({ message: 'Arquivo não encontrado' });
  }
};

// busca o último arquivo adicionado no S3 (varrendo todas as páginas do bucket) e retorna os dados com URL pré-assinada
export const getLastArchive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    let allContents: Array<{ Key?: string; LastModified?: Date; Size?: number }> = [];
    let continuationToken: string | undefined = undefined;

    do {
      const list: any = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: BUCKET_NAME,
          ContinuationToken: continuationToken,
        })
      );

      if (list.Contents) {
        allContents = allContents.concat(list.Contents);
      }

      continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
    } while (continuationToken);

    if (allContents.length === 0) {
      res.status(200).json(null);
      return;
    }

    // Ordena do mais recente para o mais antigo com base em LastModified
    const sorted = [...allContents]
      .filter((item) => Boolean(item.Key && item.LastModified))
      .sort((a, b) => new Date(b.LastModified!).getTime() - new Date(a.LastModified!).getTime());

    const latest = sorted[0];

    if (!latest || !latest.Key) {
      res.status(200).json(null);
      return;
    }

    const key = latest.Key;
    const cleanName = key.includes('-') ? key.split('-').slice(2).join('-') : key;

    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(cleanName)}"`,
      }),
      { expiresIn: EXPIRES_IN }
    );

    res.status(200).json({
      name: cleanName || key,
      size: latest.Size ?? 0,
      uploadedAt: latest.LastModified ? latest.LastModified.toISOString() : '',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Erro ao buscar último arquivo do S3:', error);
    res.status(500).json({ message: 'Erro ao buscar o último arquivo do bucket' });
  }
};
