import { Router } from 'express';
import { postArchive, upload, getArchive } from '../controllers/archive.controller';

const archiveRouter = Router();

archiveRouter.post('/upload', upload.single('file'), postArchive);
archiveRouter.get('/upload/:name', getArchive);

export default archiveRouter;