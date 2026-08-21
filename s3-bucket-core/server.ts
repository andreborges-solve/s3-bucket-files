import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
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
app.use('/auth', authRouter);

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
  console.log(`Swagger disponível em: http://localhost:${port}/docs`);
});
