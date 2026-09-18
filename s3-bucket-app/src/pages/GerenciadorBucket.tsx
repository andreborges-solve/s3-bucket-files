import React from 'react';
import { FileUpload } from '../components/FileUpload';
import { uploadArchive } from '../services/archive.service';

export const GerenciadorArquivos: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#fcfcfd',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        boxSizing: 'border-box',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '900px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
        }}
      >
        <FileUpload
          buttonText="Carregar arquivo"
          placeholderText="Arquivo.ext | 0 KB"
          onUploadClick={async (file) => {
            try {
              const data = await uploadArchive(file);
              console.log('Upload ok:', data);
              return {
                url: data.url,
                name: (data as any).originalName || file.name,
                size: data.size ?? file.size,
              };
            } catch (err) {
              console.error('Erro no upload:', err);
              return null;
            }
          }}
        />
      </div>
    </div>
  );
};

export default GerenciadorArquivos;