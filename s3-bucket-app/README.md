# s3-bucket-app

Frontend da aplicação de upload de arquivos para o bucket S3.

---

## O que faz

- Seleciona um arquivo do computador e exibe nome e tamanho (B, KB, MB, GB, TB)
- Botão "Enviar arquivo" fica desabilitado até um arquivo ser selecionado
- Ao enviar, chama o back em `POST /api/upload` e recebe o link temporário
- Exibe o link e o botão "Visualizar" que abre o arquivo numa nova aba
- O link some da tela automaticamente após 5 minutos

---

## Como rodar

```bash
npm install
npm run dev
```

Acesse em `http://localhost:5173`

> O backend precisa estar rodando em `http://localhost:3000` para o upload funcionar.

---

## Estrutura relevante

```
src/
├── components/
│   └── FileUpload.tsx       → componente principal de upload
├── pages/
│   └── GerenciadorBucket.tsx → página que monta o layout e conecta com o service
├── services/
│   └── archive.service.ts   → chamada HTTP pro backend (POST /api/upload)
└── types/
    └── file.ts              → tipos compartilhados
```

---

## Conectando com o backend

O service em `archive.service.ts` aponta pra `http://localhost:3000/api`. Quando for pra produção, troca essa URL pela do servidor.

```ts
const API_URL = 'http://localhost:3000/api';
```
