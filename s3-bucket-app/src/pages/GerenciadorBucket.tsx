import React from 'react';
import { FileUpload } from '../components/FileUpload';

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
        />
      </div>
    </div>
  );
};

export default GerenciadorArquivos;