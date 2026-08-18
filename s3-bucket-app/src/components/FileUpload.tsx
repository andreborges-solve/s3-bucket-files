import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';

export interface FileUploadProps {
  onUploadClick?: (file: File) => void;
  buttonText?: string;
  placeholderText?: string;
  uploadButtonText?: string;
}
//regra tratamento de sizes
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  if (bytes < 1024 ** 4) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${(bytes / 1024 ** 4).toFixed(1)} TB`;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadClick,
  buttonText = 'Selecione o arquivo',
  placeholderText = 'Nome do arquivo.formato | Tamanho',
  uploadButtonText = 'Enviar arquivo',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        setTempUrl(null);
        setExpiresAt(null);
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [expiresAt]);

  function handleEnviar() {
    if (!selectedFile) return;
    if (tempUrl) URL.revokeObjectURL(tempUrl);
    const url = URL.createObjectURL(selectedFile);
    const expiry = Date.now() + 5 * 60 * 1000;
    setTempUrl(url);
    setExpiresAt(expiry);
    setTimeLeft(300);
    onUploadClick?.(selectedFile);
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  const displayText = selectedFile
    ? `${selectedFile.name} | ${formatFileSize(selectedFile.size)}`
    : placeholderText;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        width: '100%',
        flexWrap: 'wrap',
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
          whiteSpace: 'nowrap',
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
          onChange={handleFileChange}
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
          minWidth: '260px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        {displayText}
      </div>

      <button
        type="button"
        onClick={handleEnviar}
        disabled={!selectedFile}
        style={{
          backgroundColor: selectedFile ? '#2e3cb4' : '#d0d5dd',
          color: '#ffffff',
          border: 'none',
          fontSize: '14px',
          fontWeight: 600,
          padding: '10px 20px',
          borderRadius: '8px',
          cursor: selectedFile ? 'pointer' : 'not-allowed',
          whiteSpace: 'nowrap',
        }}
      >
        {uploadButtonText}
      </button>

      {tempUrl && (
        <div
          style={{
            width: '100%',
            marginTop: '16px',
            backgroundColor: '#f9fafb',
            border: '1px solid #eaecf0',
            borderRadius: '8px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ fontSize: '13px', color: '#475467', flex: 1, wordBreak: 'break-all' }}>
            {tempUrl}
          </span>
          <span style={{ fontSize: '12px', color: '#f79009', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Expira em {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => window.open(tempUrl, '_blank')}
            style={{
              backgroundColor: '#2e3cb4',
              color: '#ffffff',
              border: 'none',
              fontSize: '14px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Visualizar
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;