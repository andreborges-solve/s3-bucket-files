# UploadAnexosAWS (S3 Bucket Files)

Aplicação corporativa para upload de arquivos com armazenamento direto em bucket **AWS S3**, geração de URLs pré-assinadas temporárias e autenticação OAuth2 PKCE via **Genesys Cloud**.

---

## O que a aplicação faz

- **Autenticação:** Proteção por fluxo OAuth2 Authorization Code PKCE via Genesys Cloud e validação por token JWT.
- **Upload Seguro:** Envio direto do arquivo (via memória) para o bucket AWS S3 configurado.
- **Visualização do Último Arquivo:** Ao carregar ou atualizar a tela (F5), a aplicação consulta o bucket e exibe apenas o último arquivo adicionado com o botão "Visualizar".
- **URLs Pré-assinadas:** Gera links temporários e seguros da AWS S3 para download/visualização sem expor o bucket publicamente.
- **Retenção e Limpeza Automática:** Rotina diária no backend que expurga do bucket arquivos com mais de 30 dias de armazenamento.

---

## Estrutura do projeto

```
s3-bucket-files/
├── docker-compose.yml     → Orquestração Docker dos containers (uploadanexosaws)
├── s3-bucket-app/         → Frontend React 19 + TypeScript + Vite + MUI
└── s3-bucket-core/        → Backend Node.js 20 + Express + TypeScript + AWS SDK v3
```

---

## Endpoints da API

### Autenticação (Genesys PKCE)
- `GET /login`: Redireciona o usuário para login na Genesys Cloud com PKCE.
- `GET /oauth/callback`: Recebe o authorization code, troca por token na Genesys, gera o JWT da sessão e redireciona de volta para o frontend com o token.

### Upload e Arquivos (Protegidos por Bearer JWT)
- `POST /api/upload`: Recebe o arquivo (`multipart/form-data`) e envia para o AWS S3.
- `GET /api/upload/latest`: Retorna os dados e a URL pré-assinada do último arquivo adicionado no bucket.
- `GET /api/upload/:name`: Retorna uma nova URL pré-assinada para um arquivo específico pelo nome.
- `GET /api`: Health check da API.

---

## Como Rodar

### Opção 1: Via Docker Compose (Recomendado para Produção)

Suba toda a stack em segundo plano com um único comando na raiz do projeto:

```bash
docker compose up -d --build
```

- **Frontend:** [http://localhost:5173](http://localhost:5173) (ou porta configurada)
- **Backend:** [http://localhost:3000](http://localhost:3000)

Para parar os containers:
```bash
docker compose down
```

---

### Opção 2: Localmente (Modo Desenvolvimento)

#### 1. Backend (`s3-bucket-core`)
```bash
cd s3-bucket-core
npm install
# Crie seu arquivo .env com base no .env.example
npm run dev
```

#### 2. Frontend (`s3-bucket-app`)
```bash
cd s3-bucket-app
npm install
npm run dev
```

---

## Variáveis de Ambiente (`s3-bucket-core/.env`)

Configure o arquivo `.env` dentro de `s3-bucket-core`:

```env
# Bucket S3
AWS_ACCESS_KEY_ID=sua_access_key
AWS_SECRET_ACCESS_KEY=sua_secret_key
AWS_REGION=us-east-1
AWS_URL=
AWS_BUCKET_NAME=nome-do-seu-bucket
PRESIGNED_URL_EXPIRES_IN=604800 # Validade da URL (em segundos - até 7 dias)

# Auth PKCE Genesys
GENESYS_CLIENT_ID=seu_genesys_client_id
GENESYS_REGION=sae1.pure.cloud
GENESYS_OAUTH_REDIRECT_URI=http://localhost:3000/oauth/callback
JWT_SECRET=sua_chave_secreta_jwt
FRONT_URL=http://localhost:5173
```
