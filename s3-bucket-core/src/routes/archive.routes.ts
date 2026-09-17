import { Router } from 'express';
import { postArchive, upload, getArchive, getLastArchive } from '../controllers/archive.controller';
import { authMiddleware } from '../auth/auth.middleware';

const archiveRouter = Router();

archiveRouter.post(
  '/upload',
  authMiddleware,
  (req, res, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({ message: 'O arquivo enviado excede o limite máximo permitido de 50MB.' });
          return;
        }
        res.status(400).json({ message: `Erro no upload de arquivo: ${err.message}` });
        return;
      }
      next();
    });
  },
  postArchive
);
archiveRouter.get('/upload/latest', authMiddleware, getLastArchive);
archiveRouter.get('/upload/:name', authMiddleware, getArchive);

export default archiveRouter;