# UploadAnexosAWS (S3 Bucket Files)

Aplicação corporativa para upload, consulta e retenção de arquivos com armazenamento direto em bucket **AWS S3**, persistência de metadados em **PostgreSQL**, geração de **URLs pré-assinadas temporárias** e autenticação OAuth2 PKCE via **Genesys Cloud**.

---

## 📌 Principais Funcionalidades

- **Autenticação Genesys Cloud:** Proteção por fluxo seguro OAuth2 Authorization Code PKCE via Genesys Cloud e emissão de token JWT de sessão.
- **Armazenamento Seguro em AWS S3:** Upload em memória com suporte a arquivos de até **120MB** (PDF, Imagens, Planilhas, Documentos e Zip) organizados sob a pasta virtual fixa `arquivos/`.
- **Persistência e Auditoria em PostgreSQL:** Registro de metadados completos de cada arquivo (`uploaded_by`, `filename`, `s3_key`, `file_size`, `created_at`, `expires_at`).
- **URLs Pré-assinadas Temporárias:** Acesso seguro direto da AWS S3 com tempo de expiração configurável (máximo de 7 dias), sem expor o bucket publicamente.
- **Visualização do Arquivo Mais Recente:** Consulta rápida via banco de dados (`ORDER BY created_at DESC LIMIT 1`) exibindo dados e link com renovação automática da URL assinada.
- **Política de Retenção e Limpeza Automática:** Rotina programada no backend executada no boot e a cada 24 horas, expurgando do S3 e do banco de dados os arquivos com mais de 30 dias (`expires_at <= NOW()`).

---

## 🏗️ Estrutura do Projeto

```text
s3-bucket-files/
├── docker-compose.yml         → Orquestração dos containers (database, backend e frontend)
├── README.md                  → Documentação completa da aplicação
├── database/
│   └── init.sql               → DDL da tabela 'arquivos' e índices de performance
├── s3-bucket-app/             → Frontend React 19 + TypeScript + Vite + Material UI
│   ├── src/
│   │   ├── components/        → Componente de upload com validação de 120MB e card do último arquivo
│   │   ├── pages/             → Tela de gerenciamento de anexos
│   │   └── services/          → Serviços de API e autenticação
│   ├── test/                  → Testes unitários do frontend (Vitest + Testing Library)
│   ├── Dockerfile             → Imagem de produção do frontend na porta 80
│   └── vite.config.ts         → Configuração de proxy e allowedHosts
└── s3-bucket-core/            → Backend Node.js 20 + Express + TypeScript + PostgreSQL + AWS SDK v3
    ├── database.ts            → Pool de conexão com o banco de dados PostgreSQL
    ├── server.ts              → Ponto de entrada, agendamento de limpeza e tratamento de erros global
    ├── src/
    │   ├── auth/              → Fluxo PKCE Genesys, geração e validação de JWT
    │   ├── controllers/       → Controllers de upload, download, rollback e bucket cleanup
    │   ├── routes/            → Definição das rotas com validação de limites
    │   ├── services/          → Operações SQL na tabela 'arquivos' e regras de negócio
    │   └── startup/           → Health checks automáticos no boot (Genesys, S3, DB, Rotas)
    ├── test/                  → Testes unitários do backend (Jest) e script CLI do S3
    ├── Dockerfile             → Imagem de produção do backend na porta 3000
    └── .env.example           → Modelo das variáveis de ambiente necessárias
```

---

## ⚙️ Variáveis de Ambiente (`.env`)

As configurações sensíveis ficam no arquivo `s3-bucket-core/.env`. Utilize o modelo em `s3-bucket-core/.env.example`.

### 1. Bucket AWS S3
- `AWS_ACCESS_KEY_ID`: Chave de acesso IAM da AWS com permissão no bucket.
- `AWS_SECRET_ACCESS_KEY`: Chave secreta correspondente da AWS.
- `AWS_REGION`: Região AWS onde o bucket está criado (ex: `us-east-1`).
- `AWS_BUCKET_NAME`: Nome do bucket (ex: `rede-americas-dados`).
- `PRESIGNED_URL_EXPIRES_IN`: Validade do link pré-assinado em segundos (`604800` = 7 dias).

### 2. Autenticação OAuth2 PKCE (Genesys Cloud)
- `GENESYS_CLIENT_ID`: Client ID da integração OAuth criada na Genesys Cloud.
- `GENESYS_REGION`: Região da Genesys (ex: `sae1.pure.cloud`).
- `GENESYS_OAUTH_REDIRECT_URI`: URL de callback cadastrada na Genesys:
  - **Desenvolvimento:** `http://localhost:3000/oauth/callback`
  - **Produção:** `https://<seu-dominio>/oauth/callback`
- `JWT_SECRET`: Chave secreta para assinar os tokens JWT de sessão (*em produção, use uma chave forte e aleatória*).
- `FRONT_URL`: URL do frontend para onde o backend redireciona após o login:
  - **Desenvolvimento:** `http://localhost:5173`
  - **Produção:** `https://<seu-dominio>`

### 3. Banco de Dados PostgreSQL
- `DB_HOST`: 
- `DB_PORT`: 
- `DB_DATABASE`: 
- `DB_USERNAME`: 
- `DB_PASSWORD`: 
- `DB_SCHEMA`: 

---

## 🚀 Como Executar

### Opção 1: Via Docker Compose (Recomendado para Produção / EC2)

1. Configure as variáveis de produção no arquivo `s3-bucket-core/.env`:
   - Atualize `GENESYS_OAUTH_REDIRECT_URI` e `FRONT_URL` para o domínio oficial de produção.
   - Defina um `JWT_SECRET` seguro.

2. Inicie todos os containers (Banco, Backend e Frontend):
   ```bash
   docker compose up -d --build
   ```

3. Verifique o status dos serviços:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

4. Para parar a aplicação:
   ```bash
   docker compose down
   ```

---

### Opção 2: Desenvolvimento Local

#### 1. Banco de Dados (PostgreSQL)
Inicie o container do banco:
```bash
docker compose up -d database
```

#### 2. Backend (`s3-bucket-core`)
```bash
cd s3-bucket-core
npm install
npm run dev
```
O servidor iniciará na porta `3000` com os testes automáticos de conectividade (S3, Genesys e Banco).

#### 3. Frontend (`s3-bucket-app`)
Em outro terminal:
```bash
cd s3-bucket-app
npm install
npm run dev
```
O frontend iniciará na porta `5173` e fará proxy automático para o backend.

---

## 🧪 Testes

### Backend (`s3-bucket-core`)
Suíte de testes em Jest cobrindo autenticação, middleware, permissões, upload, limite de tamanho, rollback, limpeza de expirados e segurança:
```bash
cd s3-bucket-core
npm test
```

### Frontend (`s3-bucket-app`)
Suíte de testes em Vitest + React Testing Library cobrindo renderização, seleção de arquivos, limites de 120MB, exibição do último arquivo e links:
```bash
cd s3-bucket-app
npm test
```

### Build de Produção
Para validar a compilação de produção de ambos os projetos:
```bash
# Backend
cd s3-bucket-core && npm run build

# Frontend
cd ../s3-bucket-app && npm run build
```

---

## 🛠️ Script de Gestão S3 + Banco (`test-s3`)

O projeto inclui um CLI para conferência e manutenção do bucket S3 e banco de dados:

```bash
cd s3-bucket-core
npm run test-s3
```

**Funcionalidades:**
1. **Testar Conexão:** Valida conectividade simultânea com o S3 e o PostgreSQL.
2. **Listar Arquivos:** Lista os arquivos no bucket S3 relacionando-os com os IDs e autores gravados no banco de dados.
3. **Apagar Arquivos:** Permite apagar um arquivo específico ou limpar o bucket em lote, sincronizando a exclusão física no S3 com a remoção dos registros na tabela `arquivos` do Postgres.

---

## 📋 Checklist de Deploy em Produção (AWS EC2)

Antes de realizar o commit e deploy final:

1. [ ] **Variáveis de Ambiente (`.env`):**
   - Descomentar as URLs de produção (`GENESYS_OAUTH_REDIRECT_URI` e `FRONT_URL`) com o domínio HTTPS correto.
   - Definir um `JWT_SECRET` seguro diferente do padrão de desenvolvimento.
2. [ ] **Painel Genesys Cloud:**
   - Garantir que a URL de produção (`https://<seu-dominio>/oauth/callback`) está cadastrada na lista de redirecionamentos autorizados do Client ID.
3. [ ] **Segurança de Credenciais:**
   - O arquivo `.env` nunca deve ser comitado (protegido pelo `.gitignore`).
4. [ ] **Portas do Servidor (Security Group AWS):**
   - Porta `80` (HTTP) e `443` (HTTPS) liberadas para tráfego web público.
   - Porta `5435` / `5432` restrita internamente para a aplicação.
