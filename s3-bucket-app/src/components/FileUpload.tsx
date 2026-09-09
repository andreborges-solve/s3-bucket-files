import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';

export interface UploadResult {
  url: string;
  name?: string;
  size?: number;
}

export interface FileUploadProps {
  onUploadClick?: (file: File) => Promise<UploadResult | string | null | undefined> | void;
  buttonText?: string;
  placeholderText?: string;
  uploadButtonText?: string;
}

// formata o tamanho do arquivo de bytes pra algo legível (KB, MB, GB, TB)
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
  // arquivo selecionado pelo usuário
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // url temporária gerada após o envio
  const [tempUrl, setTempUrl] = useState<string | null>(null);
  const [uploadedInfo, setUploadedInfo] = useState<{
    name: string;
    size: number;
    uploadedAt: string;
  } | null>(null);

  // temporizador de 5 minutos — controla quando o link expira e some da tela
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!expiresAt) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      if (remaining === 0) {
        clearInterval(timerRef.current!);
        setTempUrl(null);
        setUploadedInfo(null);
        setExpiresAt(null);
      }
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [expiresAt]);

  // dispara o envio usando a URL retornada pelo backend
  async function handleEnviar() {
    if (!selectedFile) return;

    if (onUploadClick) {
      const res = await onUploadClick(selectedFile);
      if (!res) return; // Se falhou o upload, não exibe nada falso

      const now = new Date().toLocaleString('pt-BR');
      let finalUrl = '';
      if (typeof res === 'string') {
        finalUrl = res;
        setUploadedInfo({
          name: selectedFile.name,
          size: selectedFile.size,
          uploadedAt: now,
        });
      } else {
        finalUrl = res.url;
        setUploadedInfo({
          name: res.name || selectedFile.name,
          size: res.size ?? selectedFile.size,
          uploadedAt: now,
        });
      }

      const expiry = Date.now() + 5 * 60 * 1000;
      setTempUrl(finalUrl);
      setExpiresAt(expiry);
    }
  }

  // captura o arquivo quando o usuário seleciona pelo input
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

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
      {/* botão que abre o seletor de arquivo do sistema */}
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

      {/* campo que mostra o nome e tamanho do arquivo selecionado */}
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxSizing: 'border-box',
        }}
      >
        {selectedFile ? (
          <>
            <span>{selectedFile.name}</span>
            <span style={{ width: '1px', height: '14px', backgroundColor: '#eaecf0', display: 'inline-block' }} />
            <span>{formatFileSize(selectedFile.size)}</span>
          </>
        ) : (
          <span>{placeholderText}</span>
        )}
      </div>

      {/* botão de envio — fica desabilitado até ter um arquivo selecionado */}
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

      {/* bloco do link temporário — aparece após o envio e some quando o link expira */}
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
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#344054',
              flex: 1,
              flexWrap: 'wrap',
            }}
          >
            {uploadedInfo ? (
              <>
                <span style={{ fontWeight: 600 }}>{uploadedInfo.name}</span>
                <span style={{ width: '1px', height: '14px', backgroundColor: '#eaecf0', display: 'inline-block' }} />
                <span>{formatFileSize(uploadedInfo.size)}</span>
                <span style={{ width: '1px', height: '14px', backgroundColor: '#eaecf0', display: 'inline-block' }} />
                <span style={{ color: '#667085', fontSize: '13px' }}>{uploadedInfo.uploadedAt}</span>
              </>
            ) : (
              <span>{tempUrl}</span>
            )}
          </div>

          {/* botão que abre o arquivo numa nova aba */}
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
