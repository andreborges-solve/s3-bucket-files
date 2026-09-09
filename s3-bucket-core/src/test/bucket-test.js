require('dotenv').config();
const readline = require('readline');
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (query) => new Promise((resolve) => rl.question(query, resolve));

async function checkConnection() {
  console.log(`\nTestando conexao com o bucket: ${bucket}...`);
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log('Conexao OK! Bucket acessivel.');
  } catch (err) {
    console.error('Erro na conexao:', err.name || err.message);
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

    console.log(`Total de arquivos: ${data.KeyCount}\n`);
    data.Contents.forEach((file, index) => {
      const kb = (file.Size / 1024).toFixed(1);
      console.log(`${index + 1}. ${file.Key} (${kb} KB)`);
    });
    return data.Contents;
  } catch (err) {
    console.error('Erro ao listar arquivos:', err.name || err.message);
    return [];
  }
}

async function deleteFiles() {
  console.log('\n--- Apagar Arquivos do Bucket ---');
  const files = await listFiles();

  if (!files || files.length === 0) {
    return;
  }

  console.log('\nOpcoes de exclusao:');
  console.log('1. Apagar um arquivo especifico');
  console.log('2. Apagar TODOS os arquivos do bucket');
  console.log('0. Voltar');

  const escolha = (await ask('\nEscolha: ')).trim();

  if (escolha === '1') {
    const num = parseInt(await ask('Digite o numero do arquivo a ser apagado: '), 10);
    const target = files[num - 1];

    if (!target) {
      console.log('Numero invalido.');
      return;
    }

    const confirm = (await ask(`Tem certeza que deseja apagar "${target.Key}"? (s/n): `)).trim().toLowerCase();
    if (confirm !== 's') {
      console.log('Operacao cancelada.');
      return;
    }

    try {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: target.Key }));
      console.log(`Arquivo "${target.Key}" apagado com sucesso!`);
    } catch (err) {
      console.error('Erro ao apagar arquivo:', err.name || err.message);
    }
  } else if (escolha === '2') {
    const confirm = (await ask(`ATENCAO: Deseja realmente apagar TODOS os ${files.length} arquivos do bucket? (digite "sim" para confirmar): `)).trim().toLowerCase();
    if (confirm !== 'sim') {
      console.log('Operacao cancelada.');
      return;
    }

    try {
      const objectsToDelete = files.map((f) => ({ Key: f.Key }));
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objectsToDelete },
        })
      );
      console.log(`Todos os ${files.length} arquivos foram apagados com sucesso!`);
    } catch (err) {
      console.error('Erro ao apagar arquivos em lote:', err.name || err.message);
    }
  }
}

async function menu() {
  while (true) {
    console.log('\n--- Menu S3 ---');
    console.log(`Bucket: ${bucket}`);
    console.log('1. Testar conexao');
    console.log('2. Listar arquivos');
    console.log('3. Apagar arquivos');
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
});
