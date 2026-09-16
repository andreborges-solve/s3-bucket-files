# UploadAnexosAWS (S3 Bucket Files)

Aplicação corporativa para upload de arquivos com armazenamento direto em bucket **AWS S3**, geração de URLs pré-assinadas temporárias e autenticação OAuth2 PKCE via **Genesys Cloud**.

---

## BRANCH EM PRODUÇÃO: main
## Feita em cima da branch: dev-s3-bucket

## O que a aplicação faz

- **Autenticação:** Proteção por fluxo OAuth2 Authorization Code PKCE via Genesys Cloud e geração de token JWT de sessão.
- **Upload Seguro:** Envio direto do arquivo (via memória) para o bucket AWS S3 configurado.
- **Visualização do Último Arquivo:** Ao carregar ou atualizar a tela (F5), a aplicação consulta o bucket e exibe os dados e o link do último arquivo adicionado.
- **URLs Pré-assinadas:** Gera links temporários e seguros da AWS S3 para download/visualização sem expor o bucket publicamente.
- **Retenção e Limpeza Automática:** Rotina diária no backend que expurga do bucket arquivos com mais de 30 dias de armazenamento.
- **Proxy Reverso Integrado:** O frontend (Vite) atua como gateway de entrada na porta 80, repassando chamadas de API e autenticação internamente para o backend, eliminando problemas de CORS e portas externas expostas.

---

## Estrutura do projeto

```text
s3-bucket-files/
├── docker-compose.yml     → Orquestração Docker dos containers (frontend na 80, backend na 3000)
├── README.md              → Documentação do projeto
├── s3-bucket-app/         → Frontend React 19 + TypeScript + Vite + Material UI
│   ├── src/               → Telas, componentes e serviços de upload/autenticação
│   ├── Dockerfile         → Build de produção do frontend rodando na porta 80
│   └── vite.config.ts     → Proxy reverso para API e configuração de allowedHosts
└── s3-bucket-core/        → Backend Node.js 20 + Express + TypeScript + AWS SDK v3
    ├── src/               → Controllers, rotas, autenticação Genesys e serviços S3
    ├── Dockerfile         → Build de produção do backend (porta 3000)
    └── .env.example       → Template com as variáveis de ambiente necessárias
```

---

## Como Funcionam as Credenciais e Variáveis de Ambiente

As configurações sensíveis ficam centralizadas no arquivo `.env` do backend (`s3-bucket-core/.env`). **Nunca comite chaves ou segredos reais no repositório**.

### 1. Armazenamento AWS S3
- `AWS_ACCESS_KEY_ID`: Identificador da chave de acesso IAM na AWS com permissões de leitura/escrita no bucket.
- `AWS_SECRET_ACCESS_KEY`: Chave secreta correspondente ao Access Key ID da AWS.
- `AWS_REGION`: Região onde o bucket S3 está hospedado (ex: `us-east-1`).
- `AWS_BUCKET_NAME`: Nome do bucket S3 onde os anexos são guardados.
- `PRESIGNED_URL_EXPIRES_IN`: Tempo de validade do link temporário de download/visualização em segundos (máximo de `604800` segundos = 7 dias).

### 2. Autenticação OAuth2 PKCE (Genesys Cloud)
- `GENESYS_CLIENT_ID`: ID da integração OAuth criada no painel de administração da Genesys Cloud.
- `GENESYS_REGION`: Domínio regional da Genesys Cloud (ex: `sae1.pure.cloud`).
- `GENESYS_OAUTH_REDIRECT_URI`: Endereço exato para onde a Genesys redireciona após o usuário logar.
  > **Atenção:** Esta mesma URL deve estar cadastrada no campo **Authorized redirect URIs** no painel da Genesys Cloud.
  > - Localmente: `http://localhost:3000/oauth/callback`
  > - Em Produção / Servidor: `https://<seu-dominio>/oauth/callback`
- `JWT_SECRET`: Chave secreta interna para assinar os tokens de sessão JWT gerados para o usuário autenticado.
- `FRONT_URL`: Endereço do frontend para onde o backend redireciona o usuário após a conclusão do login com o token.
  > - Localmente: `http://localhost`
  > - Em Produção / Servidor: `https://<seu-dominio>`

---

## Endpoints da API

### Autenticação (Genesys PKCE)
- `GET /login`: Redireciona o usuário para a tela de login da Genesys Cloud com os parâmetros PKCE (`code_challenge` e `state`).
- `GET /logout`: Efetua o logout da sessão oficial da Genesys Cloud.
- `GET /oauth/callback`: Callback recebido da Genesys; valida o PKCE, obtém o token, busca o usuário e redireciona de volta para o frontend com o token de sessão.

### Upload e Arquivos (Protegidos por Bearer JWT)
- `POST /api/upload`: Recebe o arquivo via `multipart/form-data` e envia diretamente para o S3.
- `GET /api/upload/latest`: Consulta o bucket e retorna os metadados com a URL pré-assinada do arquivo mais recente.
- `GET /api/upload/:name`: Gera uma nova URL pré-assinada para um arquivo específico pelo nome.
- `GET /api`: Health check da API.

---

## Como Rodar

### Opção 1: Via Docker Compose (Produção ou Servidor)

1. Crie o arquivo `s3-bucket-core/.env` com base no `.env.example`:
   ```bash
   cp s3-bucket-core/.env.example s3-bucket-core/.env
   # Preencha as variáveis com as credenciais do seu ambiente
   ```

2. Suba os containers com um único comando na raiz do projeto:
   ```bash
   docker compose up -d --build
   ```

- **Acesso à Aplicação:** `http://localhost` (ou o domínio/IP público configurado no servidor na porta **80**)
- O frontend na porta 80 encaminha automaticamente as rotas `/api`, `/login` e `/oauth` para o container do backend.

Para acompanhar os logs:
```bash
docker compose logs -f
```

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
npm run dev
```
O servidor backend iniciará na porta `3000`.

#### 2. Frontend (`s3-bucket-app`)
Em outro terminal:
```bash
cd s3-bucket-app
npm install
npm run dev
```
O frontend iniciará na porta `5173` e fará proxy automático para a porta `3000` do backend.

---

## Script de Teste do S3

O backend conta com um script CLI para testar a conectividade e operações com o bucket sem precisar subir a interface:

```bash
cd s3-bucket-core
npm run test-s3
```
O script permite:
1. Testar conexão com o bucket S3
2. Fazer upload de um arquivo de teste
3. Listar arquivos armazenados
4. Gerar URL pré-assinada
5. Deletar arquivo
