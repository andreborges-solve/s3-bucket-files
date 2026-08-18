import path from 'path';
import multer from 'multer';
import type { Request, Response } from 'express';

// colocar o endereço do bucket depois
const pastas3 = 'C:\\Users\\andre.borges\\Desktop\\Projetos\\s3-bucket-files\\s3bucket-example\\archives';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, pastas3),
  filename: (_req, file, cb) => cb(null, file.originalname),
});

export const upload = multer({ storage });

// recebe o arquivo via multipart/form-data, salva localmente e retorna o caminho
export const postArchive = async (req: Request, res: Response) => {
  const file = req.file;

  if (!file) {
    res.status(400).json({ message: 'Nenhum arquivo enviado' });
    return;
  }

  const filePath = path.join(pastas3, file.originalname);

  console.log({
    message: 'Arquivo salvo com sucesso',
    name: file.originalname,
    size: file.size,
    path: filePath,
  });

  // quando integrar com S3, substituir filePath pela presigned URL retornada pelo SDK
  res.status(200).json({
    message: 'Arquivo salvo com sucesso',
    url: filePath,
    name: file.originalname,
    size: file.size,
  });
};
