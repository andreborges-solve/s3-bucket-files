require('dotenv').config();
const { S3Client, HeadBucketCommand } = require('@aws-sdk/client-s3');

async function checkEnv() {
  const requiredEnvs = [
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'AWS_BUCKET_NAME',
    'GENESYS_CLIENT_ID',
    'JWT_SECRET',
  ];

  const missing = requiredEnvs.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return { ok: false, message: `Variaveis ausentes: ${missing.join(', ')}` };
  }
  return { ok: true, message: 'Credenciais OK.' };
}

async function checkS3() {
  const bucket = process.env.AWS_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  try {
    const s3 = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return { ok: true, message: `Conectado ao bucket: ${bucket}` };
  } catch (err) {
    return { ok: false, message: `Falha ao conectar ao bucket (${bucket}): ${err.name || err.message}` };
  }
}

async function checkGenesysPKCE() {
  const clientId = process.env.GENESYS_CLIENT_ID;
  const region = process.env.GENESYS_REGION || 'sae1.pure.cloud';

  if (!clientId) {
    return { ok: false, message: 'GENESYS_CLIENT_ID nao configurado' };
  }
  return { ok: true, message: `Genesys PKCE configurado (${region})` };
}

async function runChecagens() {
  console.log('Iniciando checagens...');

  const checks = [
    { name: 'Credenciais', fn: checkEnv },
    { name: 'S3', fn: checkS3 },
    { name: 'Genesys PKCE', fn: checkGenesysPKCE },
  ];

  let allOk = true;

  for (const check of checks) {
    try {
      const result = await check.fn();
      if (result.ok) {
        console.log(`ok - ${check.name}: ${result.message}`);
      } else {
        allOk = false;
        console.log(`FALHA - ${check.name}: ${result.message}`);
      }
    } catch (err) {
      allOk = false;
      console.log(`ERRO - ${check.name}: ${err.message}`);
    }
  }

  console.log('Checagens concluidas.\n');
  return allOk;
}

module.exports = { runChecagens };

if (require.main === module) {
  runChecagens();
}
