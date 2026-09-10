import { Router } from 'express';
import { postArchive, upload, getArchive, getLastArchive } from '../controllers/archive.controller';
import { authMiddleware } from '../auth/auth.middleware';

const archiveRouter = Router();

archiveRouter.post('/upload', authMiddleware, upload.single('file'), postArchive);
archiveRouter.get('/upload/latest', authMiddleware, getLastArchive);
archiveRouter.get('/upload/:name', authMiddleware, getArchive);

export default archiveRouter;