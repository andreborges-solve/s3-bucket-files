const API_URL = 'http://localhost:3000/api';

export interface UploadResponse {
  name: string;
  size: number;
  ext: string;
  url: string;
}

function getToken() {
  return localStorage.getItem('token') ?? '';
}

// envia o arquivo pro backend e retorna os dados com o link temporário
export async function uploadArchive(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erro ao enviar arquivo: ${response.statusText}`);
  }

  return response.json() as Promise<UploadResponse>;
}

export interface LatestArchiveResponse {
  name: string;
  size: number;
  uploadedAt: string;
  url: string;
}

// busca o último arquivo adicionado no bucket S3
export async function getLatestArchive(): Promise<LatestArchiveResponse | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch(`${API_URL}/upload/latest`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Erro ao buscar último arquivo:', err);
    return null;
  }
}
