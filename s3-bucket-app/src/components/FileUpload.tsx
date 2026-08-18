import React from 'react';
import type { ChangeEvent } from 'react';

export interface FileUploadProps {
  onFileChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onUploadClick?: () => void;
  fileName?: string;
  fileSize?: string;
  buttonText?: string;
  placeholderText?: string;
  uploadButtonText?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileChange,
  onUploadClick,
  fileName,
  fileSize,
  buttonText = 'Selecione o arquivo',
  placeholderText = 'Nome do arquivo.formato | tamanho',
  uploadButtonText = 'Enviar arquivo',
}) => {
  const displayText =
    fileName && fileSize ? `${fileName} | ${fileSize}` : placeholderText;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
      }}
    >
      <label
        style={{
          backgroundColor: '#2e3cb4',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '14px',
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
          userSelect: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 1px 2px rgba(16, 24, 40, 0.05)',
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
          <path d="M12 12v9" />
          <path d="m16 16-4-4-4 4" />
        </svg>
        {buttonText}
        <input
          type="file"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </label>

      <div
        style={{
          backgroundColor: '#f9fafb',
          color: '#475467',
          fontWeight: 500,
          fontSize: '14px',
          padding: '10px 20px',
          borderRadius: '8px',
          border: '1px solid #eaecf0',
          minWidth: '320px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {displayText}
      </div>

      <button
        type="button"
        onClick={onUploadClick}
        style={{
          backgroundColor: '#2e3cb4',
          color: '#ffffff',
          border: '1px solid #2e3cb4',
          fontSize: '14px',
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
      >
        {uploadButtonText}
      </button>
    </div>
  );
};

export default FileUpload;