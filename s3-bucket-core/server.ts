import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import archiveRouter from './src/routes/archive.routes';
import authRouter from './src/auth/auth.controller';
import { cleanExpiredBucketFiles } from './src/controllers/bucket.controller';
import { runSystemChecks } from './src/startup/systemCheck';

const app = express();

const allowedOrigin = process.env.FRONT_URL ?? 'http://localhost';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());

// log de todas as req que chegam no back
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.get('/api', (_req: Request, res: Response) => {
  res.json({ status: `Aplicação rodando na porta ${port}` });
});

app.use('/api', archiveRouter);
app.use(authRouter);

// Middleware de erro global para capturar qualquer exceção não tratada e responder em JSON
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('[Global Error Handler]:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Ocorreu um erro interno no servidor',
  });
});

async function bootstrap() {
  await runSystemChecks();

  // executa a limpeza de arquivos com mais de 30 dias ao iniciar e a cada 24h
  cleanExpiredBucketFiles().catch((err) => console.error('[Bucket Cleanup] Erro inicial:', err));
  setInterval(() => {
    cleanExpiredBucketFiles().catch((err) => console.error('[Bucket Cleanup] Erro rotina:', err));
  }, 24 * 60 * 60 * 1000);

  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
  });
}

bootstrap();