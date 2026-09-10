import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import archiveRouter from './src/routes/archive.routes';
import authRouter from './src/auth/auth.controller';

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'S3 Bucket Files API',
      version: '1.0.0',
      description: 'API para upload de arquivos e geração de link temporário de acesso',
    },
    servers: [{ url: 'http://localhost:3000' }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api', (_req: Request, res: Response) => {
  res.json({ status: `Aplicação rodando na porta ${port}` });
});

app.use('/api', archiveRouter);
app.use(authRouter);

import { cleanExpiredBucketFiles } from './src/controllers/bucket.controller';

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
    console.log(`Swagger disponível em: http://localhost:${port}/docs`);
  });
}

bootstrap();
