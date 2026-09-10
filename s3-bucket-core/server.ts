import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import archiveRouter from './src/routes/archive.routes';
import authRouter from './src/auth/auth.controller';
import { cleanExpiredBucketFiles } from './src/controllers/bucket.controller';

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

app.get('/api', (_req: Request, res: Response) => {
  res.json({ status: `Aplicação rodando na porta ${port}` });
});

app.use('/api', archiveRouter);
app.use(authRouter);

async function bootstrap() {
  const healthyPath = fs.existsSync(path.resolve(__dirname, 'src/test/healthy.js'))
    ? path.resolve(__dirname, 'src/test/healthy.js')
    : path.resolve(__dirname, '../src/test/healthy.js');
  const { runChecagens } = require(healthyPath);
  await runChecagens();

  // Executa a limpeza de arquivos com mais de 30 dias ao iniciar e a cada 24h
  cleanExpiredBucketFiles().catch((err) => console.error('[Bucket Cleanup] Erro inicial:', err));
  setInterval(() => {
    cleanExpiredBucketFiles().catch((err) => console.error('[Bucket Cleanup] Erro rotina:', err));
  }, 24 * 60 * 60 * 1000);

  app.listen(port, () => {
    console.log(`Servidor rodando na porta: ${port}`);
  });
}

bootstrap();
