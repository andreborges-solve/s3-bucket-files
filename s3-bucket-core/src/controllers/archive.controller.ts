import multer from 'multer';
import path from 'path';
import type { Response } from 'express';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { AuthenticatedRequest } from '../auth/auth.middleware';
import { salvarArquivo, buscarUltimoArquivo } from '../services/archive.service';

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

// memoryStorage com limites de tamanho de arquivo max 120MB e filtro de extensão
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 120 * 1024 * 1024, // 120MB max
  },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Envie apenas PDF, Imagens, Excel, Word, CSV ou TXT.'));
    }
  },
});

// recebe o arquivo, envia pro bucket, salva registro no banco e retorna a presigned URL
export const postArchive = async (req: AuthenticatedRequest, res: Response) => {
  const file = req.file;
  const usuarioLogado = req.user;

  if (!file) {
    res.status(400).json({ message: 'Nenhum arquivo enviado' });
    return;
  }

  // Salva dentro de uma pasta fixa no S3 e no banco
  const filename = path.basename(file.originalname);
  const fileKey = `arquivos/${filename}`;
  let s3Uploaded = false;

  try {
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));
    s3Uploaded = true;

    // Registra os metadados no banco de dados PostgreSQL
    const registroBanco = await salvarArquivo({
      uploaded_by: usuarioLogado?.email || 'desconhecido',
      filename: file.originalname,
      s3_key: fileKey,
      file_size: file.size,
    });

    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      }),
      { expiresIn: EXPIRES_IN }
    );

    console.log({
      message: 'Arquivo salvo com sucesso',
      id: registroBanco.id_ficha,
      key: fileKey,
      name: file.originalname,
      size: file.size,
      enviadoPor: usuarioLogado?.email,
      expiraEm: registroBanco.expires_at,
    });

    res.status(200).json({
      message: 'Arquivo enviado com sucesso',
      url: fileUrl,
      name: fileKey,
      originalName: file.originalname,
      size: file.size,
      enviadoPor: usuarioLogado?.email,
    });
  } catch (error) {
    console.error('Erro no upload S3/Banco:', error);

    // Rollback: se o arquivo subiu no S3 mas o banco falhou, remove do S3 para evitar arquivo órfão
    if (s3Uploaded) {
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
        }));
        console.warn(`[Rollback S3] Arquivo ${fileKey} removido do S3 após falha no banco de dados.`);
      } catch (rollbackError) {
        console.error('[Rollback S3 Erro] Falha ao remover arquivo órfão do S3:', rollbackError);
      }
    }

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

  // Previne path traversal e garante busca sob a pasta fixa
  const cleanName = path.basename(name);
  const safeKey = name.startsWith('arquivos/') ? `arquivos/${cleanName}` : `arquivos/${cleanName}`;

  try {
    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: safeKey,
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

// busca o último arquivo adicionado consultando direto o banco de dados e gerando URL pré-assinada
export const getLastArchive = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const ultimoRegistro = await buscarUltimoArquivo();

    if (!ultimoRegistro || !ultimoRegistro.s3_key) {
      res.status(200).json(null);
      return;
    }

    const key = ultimoRegistro.s3_key;

    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }),
      { expiresIn: EXPIRES_IN }
    );

    res.status(200).json({
      name: ultimoRegistro.filename,
      key,
      originalName: ultimoRegistro.filename,
      size: Number(ultimoRegistro.file_size) || 0,
      uploadedAt: ultimoRegistro.created_at ? new Date(ultimoRegistro.created_at).toISOString() : '',
      url: fileUrl,
    });
  } catch (error) {
    console.error('Erro ao buscar último arquivo do Banco/S3:', error);
    res.status(500).json({ message: 'Erro ao buscar o último arquivo do bucket' });
  }
};
