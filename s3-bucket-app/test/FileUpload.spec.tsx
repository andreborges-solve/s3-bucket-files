import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../src/components/FileUpload';
import * as archiveService from '../src/services/archive.service';

vi.mock('../src/services/archive.service');

const mockedGetLatestArchive = vi.mocked(archiveService.getLatestArchive);
const mockedGetArchiveUrlByName = vi.mocked(archiveService.getArchiveUrlByName);

describe('FileUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetLatestArchive.mockResolvedValue(null);
  });

  it('seleciona um arquivo, envia e exibe o resultado com o botão de visualizar', async () => {
    const user = userEvent.setup();
    const onUploadClick = vi.fn().mockResolvedValue({ url: 'https://s3/final.pdf', name: 'final.pdf', size: 500 });

    render(<FileUpload onUploadClick={onUploadClick} uploadButtonText="Enviar" placeholderText="Nenhum arquivo" />);

    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(screen.getByText('Nenhum arquivo')).toBeInTheDocument();

    const file = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByText('documento.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(onUploadClick).toHaveBeenCalledWith(file);
    expect(await screen.findByText('final.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeInTheDocument();
  });

  it('exibe mensagem de erro quando o backend recusa o upload', async () => {
    const user = userEvent.setup();
    const onUploadClick = vi.fn().mockResolvedValue(null);

    render(<FileUpload onUploadClick={onUploadClick} uploadButtonText="Enviar" />);

    const file = new File(['conteudo'], 'grande.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText(/Falha ao realizar o upload/i)).toBeInTheDocument();
  });

  it('carrega o último arquivo do bucket ao abrir a tela e permite visualizar com a url renovada', async () => {
    const user = userEvent.setup();
    mockedGetLatestArchive.mockResolvedValue({
      name: 'relatorio.pdf',
      size: 1024,
      uploadedAt: '2026-01-01T10:00:00Z',
      url: 'https://s3/antiga.pdf',
    });
    mockedGetArchiveUrlByName.mockResolvedValue('https://s3/renovada.pdf');
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<FileUpload />);

    expect(await screen.findByText('relatorio.pdf')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Visualizar' }));

    expect(mockedGetArchiveUrlByName).toHaveBeenCalledWith('relatorio.pdf');
    expect(windowOpenSpy).toHaveBeenCalledWith('https://s3/renovada.pdf', '_blank');
  });
});
