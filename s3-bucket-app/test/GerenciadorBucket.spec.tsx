import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GerenciadorBucket from '../src/pages/GerenciadorBucket';
import * as archiveService from '../src/services/archive.service';

vi.mock('../src/services/archive.service');

const mockedUploadArchive = vi.mocked(archiveService.uploadArchive);
const mockedGetLatestArchive = vi.mocked(archiveService.getLatestArchive);

describe('GerenciadorBucket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetLatestArchive.mockResolvedValue(null);
  });

  it('renderiza o botão de carregar arquivo e o campo de placeholder', () => {
    render(<GerenciadorBucket />);

    expect(screen.getByText('Carregar arquivo')).toBeInTheDocument();
    expect(screen.getByText('Arquivo.ext | 0 KB')).toBeInTheDocument();
  });

  it('botão de enviar arquivo clica e envia o arquivo selecionado pro serviço de upload', async () => {
    const user = userEvent.setup();
    mockedUploadArchive.mockResolvedValue({ name: 'relatorio.pdf', size: 1024, ext: 'pdf', url: 'https://s3/relatorio.pdf' });

    render(<GerenciadorBucket />);

    const file = new File(['conteudo'], 'relatorio.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    const botaoEnviar = screen.getByRole('button', { name: 'Enviar arquivo' });
    expect(botaoEnviar).toBeEnabled();
    await user.click(botaoEnviar);

    expect(mockedUploadArchive).toHaveBeenCalledWith(file);
    expect(await screen.findByText('relatorio.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Visualizar' })).toBeInTheDocument();
  });

  it('botão de enviar arquivo mostra mensagem de erro se o serviço de upload falhar', async () => {
    const user = userEvent.setup();
    mockedUploadArchive.mockRejectedValue(new Error('Erro ao enviar arquivo: Payload Too Large'));

    render(<GerenciadorBucket />);

    const file = new File(['conteudo'], 'grande.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Enviar arquivo' }));

    expect(await screen.findByText(/Falha ao realizar o upload/i)).toBeInTheDocument();
  });
});
