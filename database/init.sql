CREATE TABLE IF NOT EXISTS arquivos (
  id_ficha SERIAL PRIMARY KEY,
  uploaded_by VARCHAR(500) NOT NULL,
  filename VARCHAR(500) NOT NULL,     
  s3_key VARCHAR(500) NOT NULL,            
  file_size BIGINT,                             
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,       
  expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_arquivos_expires_at ON arquivos (expires_at);
CREATE INDEX IF NOT EXISTS idx_arquivos_created_at ON arquivos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_arquivos_s3_key ON arquivos (s3_key);