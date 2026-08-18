const API_URL = 'http://localhost:3000/api';

export interface UploadResponse {
  name: string;
  size: number;
  ext: string;
  url: string;
}

// envia o arquivo pro backend e retorna os dados com o link temporário
export async function uploadArchive(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erro ao enviar arquivo: ${response.statusText}`);
  }

  return response.json() as Promise<UploadResponse>;
}
