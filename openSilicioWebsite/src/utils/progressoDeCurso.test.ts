import { describe, it, expect } from 'vitest';
import {
  lerProgresso,
  marcarAutomaticamente,
  definirEstado,
  registrarVisita,
  estaConcluida,
  contarConcluidas,
  proximaAula,
  type Progresso,
} from './progressoDeCurso';

const CURSO = 'do-rtl-ao-gds';

describe('lerProgresso', () => {
  it('lê o que a própria página gravou', () => {
    const gravado = JSON.stringify({
      [CURSO]: { aulas: { pdk: 'concluida', verilog: 'nao-concluida' }, ultima: 'verilog' },
    });

    expect(lerProgresso(gravado)).toEqual({
      [CURSO]: { aulas: { pdk: 'concluida', verilog: 'nao-concluida' }, ultima: 'verilog' },
    });
  });

  it('devolve vazio para ausente, quebrado ou do tipo errado', () => {
    expect(lerProgresso(null)).toEqual({});
    expect(lerProgresso('')).toEqual({});
    expect(lerProgresso('{ isso não é json')).toEqual({});
    expect(lerProgresso('"uma string"')).toEqual({});
    expect(lerProgresso('[1, 2, 3]')).toEqual({});
  });

  it('descarta só os pedaços tortos, não o resto', () => {
    const meioQuebrado = JSON.stringify({
      bom: { aulas: { a: 'concluida', b: 'inventado' }, ultima: 'a' },
      semAulas: { ultima: 'x' },
      ultimaErrada: { aulas: { c: 'concluida' }, ultima: 42 },
    });

    expect(lerProgresso(meioQuebrado)).toEqual({
      bom: { aulas: { a: 'concluida' }, ultima: 'a' },
      ultimaErrada: { aulas: { c: 'concluida' }, ultima: null },
    });
  });
});

describe('marcação automática e manual', () => {
  it('a automática marca quando não há decisão gravada', () => {
    const depois = marcarAutomaticamente({}, CURSO, 'pdk');
    expect(estaConcluida(depois, CURSO, 'pdk')).toBe(true);
  });

  it('a automática não desfaz um desmarcar manual', () => {
    // O ponto do estado 'nao-concluida': sem ele, rolar a página de novo
    // remarcaria a aula que o leitor acabou de desmarcar.
    const desmarcada = definirEstado({}, CURSO, 'pdk', 'nao-concluida');
    const depoisDeRolar = marcarAutomaticamente(desmarcada, CURSO, 'pdk');

    expect(estaConcluida(depoisDeRolar, CURSO, 'pdk')).toBe(false);
    expect(depoisDeRolar).toBe(desmarcada);
  });

  it('o botão vence em qualquer direção', () => {
    let progresso: Progresso = marcarAutomaticamente({}, CURSO, 'pdk');
    progresso = definirEstado(progresso, CURSO, 'pdk', 'nao-concluida');
    expect(estaConcluida(progresso, CURSO, 'pdk')).toBe(false);

    progresso = definirEstado(progresso, CURSO, 'pdk', 'concluida');
    expect(estaConcluida(progresso, CURSO, 'pdk')).toBe(true);
  });

  it('não mexe no progresso de outro curso', () => {
    const antes = marcarAutomaticamente({}, 'outro-curso', 'aula');
    const depois = marcarAutomaticamente(antes, CURSO, 'pdk');

    expect(estaConcluida(depois, 'outro-curso', 'aula')).toBe(true);
    expect(estaConcluida(depois, CURSO, 'pdk')).toBe(true);
  });
});

describe('contarConcluidas', () => {
  const publicadas = ['pdk', 'verilog', 'cocotb'];

  it('conta só o que está publicado', () => {
    let progresso = marcarAutomaticamente({}, CURSO, 'pdk');
    progresso = marcarAutomaticamente(progresso, CURSO, 'aula-que-saiu-do-ar');

    expect(contarConcluidas(progresso, CURSO, publicadas)).toBe(1);
  });

  it('é zero para curso nunca aberto', () => {
    expect(contarConcluidas({}, CURSO, publicadas)).toBe(0);
  });
});

describe('proximaAula', () => {
  const publicadas = ['pdk', 'verilog', 'cocotb'];

  it('retoma na última aberta', () => {
    const progresso = registrarVisita({}, CURSO, 'verilog');
    expect(proximaAula(progresso, CURSO, publicadas)).toBe('verilog');
  });

  it('cai na primeira pendente quando a última saiu do ar', () => {
    let progresso = registrarVisita({}, CURSO, 'aula-removida');
    progresso = definirEstado(progresso, CURSO, 'pdk', 'concluida');

    expect(proximaAula(progresso, CURSO, publicadas)).toBe('verilog');
  });

  it('começa do início quando não há nada gravado', () => {
    expect(proximaAula({}, CURSO, publicadas)).toBe('pdk');
  });

  it('volta ao início quando tudo está concluído', () => {
    let progresso: Progresso = {};
    for (const slug of publicadas) progresso = definirEstado(progresso, CURSO, slug, 'concluida');
    progresso = { ...progresso, [CURSO]: { ...progresso[CURSO]!, ultima: null } };

    expect(proximaAula(progresso, CURSO, publicadas)).toBe('pdk');
  });

  it('devolve null para curso sem aula publicada', () => {
    expect(proximaAula({}, CURSO, [])).toBeNull();
  });
});
