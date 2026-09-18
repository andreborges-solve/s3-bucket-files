import { db } from '../../database';

export interface ArquivoRegistro {
  id_ficha?: number;
  uploaded_by: string;
  filename: string;
  s3_key: string;
  file_size: number;
  created_at?: Date;
  expires_at?: Date;
}

// salva o registro do arquivo no banco
export async function salvarArquivo(dados: ArquivoRegistro): Promise<ArquivoRegistro> {
  const query = `
    INSERT INTO arquivos (uploaded_by, filename, s3_key, file_size)
    VALUES ($1, $2, $3, $4)
    RETURNING id_ficha, uploaded_by, filename, s3_key, file_size, created_at, expires_at
  `;
  const values = [dados.uploaded_by, dados.filename, dados.s3_key, dados.file_size];
  const { rows } = await db.query(query, values);
  return rows[0];
}

// busca o arquivo mais recente registrado no banco
export async function buscarUltimoArquivo(): Promise<ArquivoRegistro | null> {
  const query = `
    SELECT id_ficha, uploaded_by, filename, s3_key, file_size, created_at, expires_at
    FROM arquivos
    ORDER BY created_at DESC
    LIMIT 1
  `;
  const { rows } = await db.query(query);
  return rows[0] || null;
}

// busca todos os arquivos que ja expiraram 
export async function buscarArquivosExpirados(): Promise<ArquivoRegistro[]> {
  const query = `
    SELECT id_ficha, uploaded_by, filename, s3_key, file_size, created_at, expires_at
    FROM arquivos
    WHERE expires_at <= CURRENT_TIMESTAMP
  `;
  const { rows } = await db.query(query);
  return rows;
}

// remove os arquivos expirados do banco após a exclusão no S3
export async function removerArquivosPorIds(ids: number[]): Promise<number> {
  if (!ids || ids.length === 0) return 0;
  const query = `
    DELETE FROM arquivos
    WHERE id_ficha = ANY($1::int[])
  `;
  const result = await db.query(query, [ids]);
  return result.rowCount ?? 0;
}
