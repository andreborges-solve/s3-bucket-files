import express, { type Request, type Response } from 'express';
import cors from 'cors';
import archiveRouter from './src/routes/archive.routes';

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

app.get('/api', (_req: Request, res: Response) => {
  res.json({ status: `Aplicação rodando na porta ${port}` });
});

app.use('/api', archiveRouter);

app.listen(port, () => {
  console.log(`Servidor rodando na porta: ${port}`);
});
