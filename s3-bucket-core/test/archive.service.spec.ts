import { gerarProximoNome } from '../src/services/archive.service';

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
