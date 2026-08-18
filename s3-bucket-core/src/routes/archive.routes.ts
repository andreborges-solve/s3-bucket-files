import { Router } from 'express';
import { postArchive, upload, getArchive } from '../controllers/archive.controller';

const archiveRouter = Router();


archiveRouter.post('/upload', upload.single('file'), postArchive);// rota de upload — o multer processa o arquivo antes de chegar no controller
archiveRouter.get('/upload/:name', getArchive); // rota de visualização — retorna o arquivo pelo nome

export default archiveRouter;