# S3 Bucket Files

Aplicação para upload de arquivos para um bucket S3 com geração de link temporário de acesso.

---

## Frontend

- Seleção de arquivo com exibição de nome e tamanho (B, KB, MB, GB, TB)
- Botão "Enviar arquivo" desabilitado até um arquivo ser selecionado
- Geração de link temporário
- Botão "Visualizar" que abre o arquivo em uma aba nova

> O link é gerado localmente (`createObjectURL`). Quando o back estiver pronto, é só substituir pela presigned URL retornada pelo S3.

---

## Conectar com o back

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
- `PRESIGNED_URL_EXPIRES_IN` — tempo em segundos que o link temporário vai durar (300 = 5 minutos)

---

## Endpoint esperado pelo front

O front vai fazer uma chamada assim quando o back estiver pronto:

```
POST /api/upload
Content-Type: multipart/form-data

file: <arquivo selecionado>
```

E espera receber:

```json
{
  "url": "https://s3.amazonaws.com/seu-bucket/arquivo.pdf?X-Amz-Expires=300&..."
}
```