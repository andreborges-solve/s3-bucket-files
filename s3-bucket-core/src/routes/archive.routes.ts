import { Router } from 'express';
import { postArchive, upload } from '../controllers/archive.controller';

const archiveRouter = Router();

// rota de upload — o multer processa o arquivo antes de chegar no controller
archiveRouter.post('/upload', upload.single('file'), postArchive);

export default archiveRouter;
