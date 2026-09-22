import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileManagerScreen from '../src/components/FileManagerScreen';
import * as archiveService from '../src/services/archive.service';

vi.mock('../src/services/archive.service');

describe('FileManagerScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(archiveService.getLatestArchive).mockResolvedValue(null);
  });

  it('renderiza o botão padrão de seleção de arquivo', () => {
    render(<FileManagerScreen />);

    expect(screen.getByText('Selecione o arquivo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar arquivo' })).toBeDisabled();
  });

  it('botão de enviar arquivo permanece desabilitado até um arquivo ser selecionado', async () => {
    const user = userEvent.setup();
    render(<FileManagerScreen />);

    const file = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    expect(screen.getByRole('button', { name: 'Enviar arquivo' })).toBeEnabled();
  });

  it('clicar em enviar arquivo sem onUploadClick configurado não quebra a tela', async () => {
    const user = userEvent.setup();
    render(<FileManagerScreen />);

    const file = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('button', { name: 'Enviar arquivo' }));

    expect(screen.getByRole('button', { name: 'Enviar arquivo' })).toBeInTheDocument();
  });
});
