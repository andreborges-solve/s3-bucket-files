jest.mock('../database', () => ({
  db: {
    query: jest.fn(),
  },
}));

import { db } from '../database';
import {
  gerarProximoNome,
  buscarArquivosPorNomeBase,
  salvarArquivo,
  buscarUltimoArquivo,
  buscarArquivosExpirados,
  removerArquivosPorIds,
} from '../src/services/archive.service';

const queryMock = db.query as jest.Mock;

describe('archive.service - gerarProximoNome', () => {
  it('mantém o nome original se não existir duplicidade', () => {
    const nome = gerarProximoNome('relatorio.pdf', []);
    expect(nome).toBe('relatorio.pdf');
  });

  it('adiciona sufixo (1) se o nome original já existir', () => {
    const nome = gerarProximoNome('relatorio.pdf', ['relatorio.pdf']);
    expect(nome).toBe('relatorio (1).pdf');
  });

  it('adiciona sufixo sequencial se (1) já existir', () => {
    const nome = gerarProximoNome('relatorio.pdf', ['relatorio.pdf', 'relatorio (1).pdf']);
    expect(nome).toBe('relatorio (2).pdf');
  });

  it('preenche lacunas corretamente', () => {
    const nome = gerarProximoNome('dados.csv', ['dados.csv', 'dados (2).csv']);
    expect(nome).toBe('dados (1).csv');
  });

  it('funciona com arquivos sem extensão', () => {
    const nome = gerarProximoNome('README', ['README']);
    expect(nome).toBe('README (1)');
  });
});

describe('archive.service - persistência', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('busca nomes existentes pela base e pela extensão', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ filename: 'relatorio.pdf' }, { filename: 'relatorio (1).pdf' }],
    });

    const nomes = await buscarArquivosPorNomeBase('relatorio', '.pdf');

    expect(nomes).toEqual(['relatorio.pdf', 'relatorio (1).pdf']);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('FROM arquivos');
    expect(sql).toContain('filename = $1 OR filename LIKE $2');
    expect(params).toEqual(['relatorio.pdf', 'relatorio (%).pdf']);
  });

  it('insere o registro e devolve a linha criada', async () => {
    const criado = {
      id_ficha: 3,
      uploaded_by: 'autor@empresa.com',
      filename: 'relatorio.pdf',
      s3_key: 'arquivos/relatorio.pdf',
      file_size: 10,
      created_at: new Date('2026-09-01T10:00:00Z'),
      expires_at: new Date('2026-10-01T10:00:00Z'),
    };
    queryMock.mockResolvedValueOnce({ rows: [criado] });

    const resultado = await salvarArquivo({
      uploaded_by: 'autor@empresa.com',
      filename: 'relatorio.pdf',
      s3_key: 'arquivos/relatorio.pdf',
      file_size: 10,
    });

    expect(resultado).toEqual(criado);
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('INSERT INTO arquivos');
    expect(params).toEqual(['autor@empresa.com', 'relatorio.pdf', 'arquivos/relatorio.pdf', 10]);
  });

  it('busca o arquivo mais recente pelo created_at', async () => {
    const recente = {
      id_ficha: 1,
      filename: 'recente.pdf',
      s3_key: 'arquivos/recente.pdf',
      file_size: 1,
      uploaded_by: 'autor@empresa.com',
    };
    queryMock.mockResolvedValueOnce({ rows: [recente] });

    const resultado = await buscarUltimoArquivo();

    expect(resultado).toEqual(recente);
    const [sql] = queryMock.mock.calls[0];
    expect(sql).toContain('ORDER BY created_at DESC');
    expect(sql).toContain('LIMIT 1');
  });

  it('retorna null quando não há arquivo registrado', async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    await expect(buscarUltimoArquivo()).resolves.toBeNull();
  });

  it('consulta apenas arquivos com expires_at vencido', async () => {
    queryMock.mockResolvedValueOnce({
      rows: [{ id_ficha: 9, s3_key: 'arquivos/velho.pdf' }],
    });

    const expirados = await buscarArquivosExpirados();

    expect(expirados).toHaveLength(1);
    const [sql] = queryMock.mock.calls[0];
    expect(sql).toContain('WHERE expires_at <= CURRENT_TIMESTAMP');
  });

  it('não consulta o banco quando não há ids para remover', async () => {
    await expect(removerArquivosPorIds([])).resolves.toBe(0);
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('remove os registros pelos ids e devolve a quantidade', async () => {
    queryMock.mockResolvedValueOnce({ rowCount: 2 });

    await expect(removerArquivosPorIds([1, 2])).resolves.toBe(2);

    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain('DELETE FROM arquivos');
    expect(sql).toContain('ANY($1::int[])');
    expect(params).toEqual([[1, 2]]);
  });
});
