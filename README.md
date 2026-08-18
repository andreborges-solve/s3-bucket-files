# S3 Bucket Files

Aplicação para upload de arquivos para um bucket S3 com geração de link temporário de acesso.

---

## O que a aplicação faz

- Você seleciona um arquivo no front, clica em "Enviar arquivo" e ele é salvo no servidor
- O back retorna um link temporário de acesso ao arquivo
- O link fica disponível por 5 minutos — depois some da tela automaticamente
- O botão "Visualizar" abre o arquivo numa nova aba

---

## Estrutura do projeto

```
s3-bucket-files/
├── s3-bucket-app/     → frontend em React + TypeScript
└── s3-bucket-core/    → backend em Node + Express + TypeScript
```

---

## Endpoints

### POST /api/upload
Recebe o arquivo e salva no servidor (futuramente no bucket S3).

**Requisição**
```
Content-Type: multipart/form-data

file: <arquivo selecionado>
```

**Resposta de sucesso (200)**
```json
{
  "message": "Arquivo salvo com sucesso",
  "url": "http://localhost:3000/api/upload/arquivo.pdf",
  "name": "arquivo.pdf",
  "size": 204800
}
```

**Resposta de erro (400)**
```json
{
  "message": "Nenhum arquivo enviado"
}
```

---

### GET /api/upload/:name
Retorna o arquivo pelo nome. É essa URL que o botão "Visualizar" abre.

**Exemplo**
```
GET /api/upload/arquivo.pdf
```

**Resposta de sucesso (200)**
Retorna o arquivo diretamente (stream), abrindo no browser.

**Resposta de erro (404)**
```json
{
  "message": "Arquivo não encontrado"
}
```

---

### GET /api
Health check — só pra confirmar que o servidor está rodando.

**Resposta (200)**
```json
{
  "status": "Aplicação rodando na porta 3000"
}
```

---

## Como rodar

**Backend**
```bash
cd s3-bucket-core
npm install
npm run dev
```

**Frontend**
```bash
cd s3-bucket-app
npm install
npm run dev
```

---

## Variáveis de ambiente — quando integrar com o S3

Crie um arquivo `.env` na raiz do `s3-bucket-core` com as seguintes variáveis:

```env
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=nome-do-seu-bucket
PRESIGNED_URL_EXPIRES_IN=300
```

- `AWS_ACCESS_KEY_ID` e `AWS_SECRET_ACCESS_KEY` — credenciais do usuário IAM com permissão no S3
- `AWS_REGION` — região onde o bucket foi criado (ex: `us-east-1`, `sa-east-1`)
- `S3_BUCKET_NAME` — nome exato do bucket
- `PRESIGNED_URL_EXPIRES_IN` — tempo em segundos que o link vai durar (300 = 5 minutos)

---

## Permissões IAM mínimas necessárias

```json
{
  "Effect": "Allow",
  "Action": [
    "s3:PutObject",
    "s3:GetObject"
  ],
  "Resource": "arn:aws:s3:::nome-do-seu-bucket/*"
}
```

---

## O que muda quando integrar com o S3

Hoje o arquivo é salvo numa pasta local. Quando o bucket estiver pronto, só muda o controller — em vez de salvar com `multer.diskStorage`, você usa o SDK da AWS pra fazer o upload e gera a presigned URL. O front não muda nada.
