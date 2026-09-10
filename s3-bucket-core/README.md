# s3-bucket-core

Backend em Node.js, Express e TypeScript da aplicação **UploadAnexosAWS**.

---

## Recursos

- **Integração com AWS S3:** Utiliza o `@aws-sdk/client-s3` e `@aws-sdk/s3-request-presigner` para persistência e geração de URLs pré-assinadas seguras.
- **Autenticação PKCE Genesys:** Fluxo OAuth2 com PKCE para emissão de JWT.
- **Middleware de Autenticação:** Protege as rotas de upload e consulta de arquivos via header `Authorization: Bearer <token>`.
- **Limpeza Automática (Retenção de 30 dias):** Varredura executada na inicialização do servidor e diariamente para deletar objetos com mais de 30 dias do bucket.

---

## Como Rodar

```bash
npm install
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

---

## Scripts Disponíveis

- `npm run dev`: Executa o servidor em desenvolvimento com `tsx server.ts`.
- `npm run build`: Compila o TypeScript para JavaScript na pasta `dist/` (`tsc`).
- `npm run start`: Inicia a versão compilada em produção (`node dist/server.js`).
- `npm run test-s3`: Executa o script de verificação de conexão com o bucket S3.

---

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/login` | Inicia o fluxo de autenticação Genesys PKCE |
| `GET` | `/oauth/callback` | Callback de autenticação e retorno do JWT |
| `POST` | `/api/upload` | Upload de arquivo e retorno do link temporário |
| `GET` | `/api/upload/latest` | Dados e link pré-assinado do último arquivo |
| `GET` | `/api/upload/:name` | Link pré-assinado para arquivo pelo nome |
| `GET` | `/api` | Health check da API |

