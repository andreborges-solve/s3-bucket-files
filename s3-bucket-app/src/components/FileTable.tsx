import React from 'react';
import type { FileData } from '../types/file';

export interface FileTableProps {
  rows?: FileData[];
  totalRows?: number;
  title?: string;
  downloadButtonText?: string;
  onDownloadAllClick?: () => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  rows = [],
  totalRows = 6,
  title = 'Arquivos enviados',
  downloadButtonText = 'Baixar',
  onDownloadAllClick,
}) => {
  const emptyRowsCount = Math.max(0, totalRows - rows.length);

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '900px',
        backgroundColor: '#ffffff',
        border: '1px solid #eaecf0',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(16, 24, 40, 0.1)',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: '1px solid #eaecf0',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: 600,
            color: '#101828',
          }}
        >
          {title}
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={onDownloadAllClick}
            style={{
              backgroundColor: '#2e3cb4',
              color: '#ffffff',
              border: '1px solid #2e3cb4',
              fontSize: '14px',
              fontWeight: 600,
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {downloadButtonText}
          </button>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          tableLayout: 'fixed',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #eaecf0' }}>
            <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#475467', width: '30%' }}>
              Nome
            </th>
            <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#475467', width: '15%' }}>
              Formato
            </th>
            <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#475467', width: '15%' }}>
              Tamanho
            </th>
            <th style={{ padding: '12px 24px', fontSize: '12px', fontWeight: 600, color: '#475467', width: '40%' }}>
              Endereço
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={index}
              style={{
                borderBottom: '1px solid #eaecf0',
                height: '60px',
              }}
            >
              <td style={{ padding: '14px 24px' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#101828' }}>
                  {row.nome}
                </span>
              </td>
              <td style={{ padding: '14px 24px' }}>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    backgroundColor: '#f2f4f7',
                    color: '#344054',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                  }}
                >
                  {row.formato}
                </span>
              </td>
              <td style={{ padding: '14px 24px', fontSize: '14px', color: '#475467' }}>
                {row.tamanho}
              </td>
              <td style={{ padding: '14px 24px', fontSize: '14px', color: '#667085' }}>
                {row.endereco}
              </td>
            </tr>
          ))}

          {Array.from({ length: emptyRowsCount }).map((_, index) => (
            <tr
              key={`empty-${index}`}
              style={{
                borderBottom: index === emptyRowsCount - 1 ? 'none' : '1px solid #eaecf0',
                height: '52px',
              }}
            >
              <td style={{ padding: '14px 24px' }}>&nbsp;</td>
              <td style={{ padding: '14px 24px' }}>&nbsp;</td>
              <td style={{ padding: '14px 24px' }}>&nbsp;</td>
              <td style={{ padding: '14px 24px' }}>&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileTable;