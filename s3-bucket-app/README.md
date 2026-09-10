# s3-bucket-app

Frontend da aplicação de upload e visualização de arquivos do bucket S3 (**UploadAnexosAWS**).

---

## Recursos

- **Integração OAuth2 com Genesys:** Verifica a presença do JWT de autenticação e redireciona automaticamente para o fluxo de login caso o usuário não esteja autenticado.
- **Seletor de Arquivos:** Exibe nome e tamanho formatado de forma dinâmica (`B`, `KB`, `MB`, `GB`, `TB`).
- **Upload Seguro:** Envia o arquivo para a API com o token JWT no cabeçalho `Authorization: Bearer <token>`.
- **Card do Último Arquivo:** Ao carregar a página ou dar F5, consulta a API (`/api/upload/latest`) e exibe apenas o arquivo mais recente disponível no bucket com botão **"Visualizar"** que abre o link em nova aba.

---

## Como Rodar

```bash
npm install
npm run dev
```

Acesse em: `http://localhost:5173`

> O backend (`s3-bucket-core`) precisa estar em execução em `http://localhost:3000`.

---

## Scripts Disponíveis

- `npm run dev`: Inicia o Vite dev server com hot-reload.
- `npm run build`: Valida tipagens com TypeScript (`tsc -b`) e gera o bundle de produção em `dist/`.
- `npm run start`: Roda o `vite preview` expondo a versão compilada em produção (`--host 0.0.0.0 --port 5173`).
- `npm run lint`: Executa a verificação de código com ESLint.

---

## Estrutura dos Arquivos

```
src/
├── components/
│   └── FileUpload.tsx        → Componente de upload e exibição do último arquivo
├── pages/
│   └── GerenciadorBucket.tsx  → Layout centralizado da aplicação
├── services/
│   └── archive.service.ts    → Comunicação HTTP com a API (upload e latest)
├── App.tsx                   → Gerenciamento da sessão JWT e validação de autenticação
└── main.tsx                  → Ponto de entrada do React
```
