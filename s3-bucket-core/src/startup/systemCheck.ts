import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { db } from '../../database';

const green = '\x1b[32m';
const reset = '\x1b[0m';

const ok = (label: string) => console.log(`${label}: ${green}ok ✔${reset}`);

async function checkGenesys() {
  const configurado = Boolean(process.env.GENESYS_CLIENT_ID && process.env.GENESYS_OAUTH_REDIRECT_URI);
  if (configurado) {
    ok('Conexão com genesys');
  } else {
    console.log('Conexão com genesys: \x1b[31mfalhou ✖\x1b[0m (GENESYS_CLIENT_ID ou GENESYS_OAUTH_REDIRECT_URI não definidos)');
  }
}

async function checkS3() {
  try {
    const s3 = new S3Client({
      region: process.env.AWS_REGION,
      endpoint: process.env.AWS_URL,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
      forcePathStyle: true,
    });

    await s3.send(new HeadBucketCommand({ Bucket: process.env.AWS_BUCKET_NAME }));
    ok('Conexão com bucket aws s3');
  } catch (error: any) {
    console.log(`Conexão com bucket aws s3: \x1b[31mfalhou ✖\x1b[0m (${error?.name || error?.message || 'erro desconhecido'})`);
  }
}

async function checkDB() {
  try {
    await db.query('SELECT NOW()');
    ok('Conexão com banco de dados');
  } catch (error: any) {
    console.log(`Conexão com banco de dados: \x1b[31mfalhou ✖\x1b[0m (${error?.name || error?.message || 'erro desconhecido'})`);
  }
}

const ROTAS = [
  'GET  /login',
  'GET  /logout',
  'GET  /oauth/callback',
  'POST /api/upload',
  'GET  /api/upload/latest',
  'GET  /api/upload/:name',
];

function checkRotas() {
  console.log('Rotas:');
  ROTAS.forEach((rota) => ok(`  ${rota}`));
}

// roda as checagens essenciais no boot
export async function runSystemChecks(): Promise<void> {
  await checkGenesys();
  await checkS3();
  await checkDB();
  checkRotas();
}
