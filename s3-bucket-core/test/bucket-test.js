require('dotenv').config();
const readline = require('readline');
const { Pool } = require('pg');
const {
  S3Client,
  HeadBucketCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');

const bucket = process.env.AWS_BUCKET_NAME;

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5435,
  user: process.env.DB_USERNAME || 'uploads4me',
  password: process.env.DB_PASSWORD || 'uploads4me',
  database: process.env.DB_DATABASE || 's3_bucket',
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkConnection() {
  console.log(`\nTestando conexao com o bucket: ${bucket}...`);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('Conexao OK! Bucket S3 acessivel.');
  } catch (err) {
    console.error('Erro na conexao S3:', err.name || err.message);
  }

  console.log('Testando conexao com o banco de dados PostgreSQL...');
  try {
    const res = await pool.query('SELECT NOW() as agora');
    console.log('Conexao OK! Banco de dados acessivel:', res.rows[0].agora);
  } catch (err) {
    console.error('Erro na conexao com Banco:', err.message);
  }
}

async function listFiles() {
  console.log(`\nBuscando arquivos em ${bucket}...`);
  try {
    const data = await s3.send(new ListObjectsV2Command({ Bucket: bucket }));

    if (!data.Contents || data.Contents.length === 0) {
      console.log('Bucket vazio.');
      return [];
    }

    console.log(`Total de arquivos no S3: ${data.KeyCount}\n`);

    // Busca dados correspondentes no banco
    let dbFilesMap = new Map();
    try {
      const dbRes = await pool.query('SELECT id_ficha, filename, s3_key, uploaded_by, created_at, expires_at FROM arquivos');
      dbRes.rows.forEach((r) => {
        dbFilesMap.set(r.s3_key, r);
        // Também mapeia pelo filename puro caso tenha sido salvo antes sem prefixo
        dbFilesMap.set(r.filename, r);
      });
    } catch (dbErr) {
      console.warn('Aviso: Não foi possível carregar metadados do banco:', dbErr.message);
    }

    data.Contents.forEach((file, index) => {
      const kb = (file.Size / 1024).toFixed(1);
      const dbInfo = dbFilesMap.get(file.Key);
      const dbStatus = dbInfo ? `[DB ID: ${dbInfo.id_ficha} | Por: ${dbInfo.uploaded_by}]` : '[Sem registro no DB]';
      console.log(`${index + 1}. ${file.Key} (${kb} KB) ${dbStatus}`);
    });

    return data.Contents;
  } catch (err) {
    console.error('Erro ao listar arquivos:', err.name || err.message);
    return [];
  }
}

async function deleteFiles() {
  console.log('\n--- Apagar Arquivos do Bucket e Banco ---');
  const files = await listFiles();

  if (!files || files.length === 0) {
    return;
  }

  console.log('\nOpcoes de exclusao:');
  console.log('1. Apagar um arquivo especifico (S3 + Banco)');
  console.log('2. Apagar TODOS os arquivos (S3 + Banco)');
  console.log('0. Voltar');

  const escolha = (await ask('\nEscolha: ')).trim();

  if (escolha === '1') {
    const num = parseInt(await ask('Digite o numero do arquivo a ser apagado: '), 10);
    const target = files[num - 1];

    if (!target) {
      console.log('Numero invalido.');
      return;
    }

    const confirm = (await ask(`Tem certeza que deseja apagar "${target.Key}" do S3 e do Banco? (s/n): `)).trim().toLowerCase();
    if (confirm !== 's') {
      console.log('Operacao cancelada.');
      return;
    }

    try {
      // 1. Deleta do S3
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: target.Key }));
      console.log(`Arquivo "${target.Key}" apagado do S3 com sucesso!`);

      // 2. Deleta do Banco de Dados
      const dbRes = await pool.query(
        'DELETE FROM arquivos WHERE s3_key = $1 OR filename = $1 RETURNING id_ficha, filename',
        [target.Key]
      );
      if (dbRes.rowCount > 0) {
        console.log(`Registro removido do banco de dados (ID: ${dbRes.rows[0].id_ficha}) ✔`);
      } else {
        console.log('Nenhum registro correspondente precisava ser removido no banco.');
      }
    } catch (err) {
      console.error('Erro ao apagar arquivo:', err.name || err.message);
    }
  } else if (escolha === '2') {
    const confirm = (await ask(`ATENCAO: Deseja realmente apagar TODOS os ${files.length} arquivos do S3 e do Banco? (digite "sim" para confirmar): `)).trim().toLowerCase();
    if (confirm !== 'sim') {
      console.log('Operacao cancelada.');
      return;
    }

    try {
      // 1. Deleta do S3
      const objectsToDelete = files.map((f) => ({ Key: f.Key }));
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objectsToDelete },
        })
      );
      console.log(`Todos os ${files.length} arquivos foram apagados do S3 com sucesso!`);

      // 2. Deleta do Banco de Dados
      const keys = files.map((f) => f.Key);
      const dbRes = await pool.query(
        'DELETE FROM arquivos WHERE s3_key = ANY($1::text[]) OR filename = ANY($1::text[])',
        [keys]
      );
      console.log(`${dbRes.rowCount} registro(s) foram apagados da tabela arquivos no banco ✔`);
    } catch (err) {
      console.error('Erro ao apagar arquivos em lote:', err.name || err.message);
    }
  }
}

async function menu() {
  while (true) {
    console.log('\n--- Menu S3 + PostgreSQL ---');
    console.log(`Bucket: ${bucket}`);
    console.log('1. Testar conexao (S3 e Banco)');
    console.log('2. Listar arquivos (S3 + status no Banco)');
    console.log('3. Apagar arquivos (S3 + Banco sincronizado)');
    console.log('0. Sair');

    const opt = (await ask('\nOpcao: ')).trim();

    if (opt === '1') {
      await checkConnection();
    } else if (opt === '2') {
      await listFiles();
    } else if (opt === '3') {
      await deleteFiles();
    } else if (opt === '0') {
      console.log('Saindo...');
      rl.close();
      await pool.end();
      break;
    } else {
      console.log('Opcao invalida.');
    }

    await ask('\nEnter para continuar...');
  }
}

menu().catch((err) => {
  console.error('Erro:', err);
  rl.close();
  pool.end();
});
