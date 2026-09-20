import { describe, it, expect } from 'vitest';
import {
  lerProgresso,
  marcarAutomaticamente,
  definirEstado,
  registrarVisita,
  registrarTentativa,
  quizConcluido,
  melhorNota,
  tentativasDoQuiz,
  contarAtividadesConcluidas,
  proximaAtividade,
  zerarCurso,
  temProgressoGravado,
  estaConcluida,
  contarConcluidas,
  contaveis,
  proximaAula,
  type Progresso,
} from './progressoDeCurso';

const CURSO = 'do-rtl-ao-gds';

/** Atalho para montar a lista de publicadas que as contas recebem. */
const aula = (slug: string, opcional = false) => ({ slug, opcional });

describe('lerProgresso', () => {
  it('lê o que a própria página gravou', () => {
    const gravado = JSON.stringify({
      [CURSO]: {
        aulas: { pdk: 'concluida', verilog: 'nao-concluida' },
        quizzes: { revisao: { melhorNota: 80, tentativas: 2 } },
        ultima: { tipo: 'quiz', slug: 'revisao' },
      },
    });

    expect(lerProgresso(gravado)).toEqual({
      [CURSO]: {
        aulas: { pdk: 'concluida', verilog: 'nao-concluida' },
        quizzes: { revisao: { melhorNota: 80, tentativas: 2 } },
        ultima: { tipo: 'quiz', slug: 'revisao' },
      },
    });
  });

  it('migra o formato antigo sem perder aulas nem a última visita', () => {
    const antigo = JSON.stringify({
      [CURSO]: { aulas: { pdk: 'concluida' }, ultima: 'pdk' },
    })

    expect(lerProgresso(antigo)).toEqual({
      [CURSO]: {
        aulas: { pdk: 'concluida' },
        quizzes: {},
        ultima: { tipo: 'aula', slug: 'pdk' },
      },
    })
  })

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
      bom: { aulas: { a: 'concluida' }, quizzes: {}, ultima: { tipo: 'aula', slug: 'a' } },
      ultimaErrada: { aulas: { c: 'concluida' }, quizzes: {}, ultima: null },
    });
  });

  it('descarta um quiz corrompido e preserva o restante do curso', () => {
    const meioQuebrado = JSON.stringify({
      [CURSO]: {
        aulas: { pdk: 'concluida' },
        quizzes: {
          bom: { melhorNota: 70, tentativas: 1 },
          notaRuim: { melhorNota: 'setenta', tentativas: 2 },
          tentativasRuins: { melhorNota: 90, tentativas: -1 },
        },
        ultima: { tipo: 'quiz', slug: 'bom' },
      },
    })

    expect(lerProgresso(meioQuebrado)).toEqual({
      [CURSO]: {
        aulas: { pdk: 'concluida' },
        quizzes: { bom: { melhorNota: 70, tentativas: 1 } },
        ultima: { tipo: 'quiz', slug: 'bom' },
      },
    })
  })
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

describe('zerarCurso', () => {
  it('apaga concluídas, desmarcadas e última aula, só do curso pedido', () => {
    let progresso = definirEstado({}, CURSO, 'pdk', 'concluida');
    progresso = definirEstado(progresso, CURSO, 'verilog', 'nao-concluida');
    progresso = registrarVisita(progresso, CURSO, { tipo: 'aula', slug: 'verilog' });
    progresso = registrarTentativa(progresso, CURSO, 'revisao', 80);
    progresso = definirEstado(progresso, 'outro-curso', 'aula', 'concluida');

    const depois = zerarCurso(progresso, CURSO);

    expect(depois[CURSO]).toBeUndefined();
    expect(proximaAula(depois, CURSO, [aula('pdk'), aula('verilog')])).toBe('pdk');
    expect(estaConcluida(depois, 'outro-curso', 'aula')).toBe(true);
  });

  it('devolve o mesmo objeto quando não há nada gravado do curso', () => {
    const progresso = definirEstado({}, 'outro-curso', 'aula', 'concluida');
    expect(zerarCurso(progresso, CURSO)).toBe(progresso);
  });

  it('ter aberto uma aula não é progresso; marcar ou desmarcar é', () => {
    // É o que decide se o botão de zerar aparece: sem isto, quem só abriu a
    // primeira aula veria "zerar progresso" ainda em 0 de N.
    expect(
      temProgressoGravado(registrarVisita({}, CURSO, { tipo: 'aula', slug: 'pdk' }), CURSO),
    ).toBe(false);
    expect(temProgressoGravado(definirEstado({}, CURSO, 'pdk', 'nao-concluida'), CURSO)).toBe(true);
    expect(temProgressoGravado(marcarAutomaticamente({}, CURSO, 'pdk'), CURSO)).toBe(true);
    expect(temProgressoGravado(registrarTentativa({}, CURSO, 'quiz', 40), CURSO)).toBe(true);
    expect(temProgressoGravado({}, CURSO)).toBe(false);
  });
});

describe('contarConcluidas', () => {
  const publicadas = [aula('pdk'), aula('verilog'), aula('cocotb')];

  it('conta só o que está publicado', () => {
    let progresso = marcarAutomaticamente({}, CURSO, 'pdk');
    progresso = marcarAutomaticamente(progresso, CURSO, 'aula-que-saiu-do-ar');

    expect(contarConcluidas(progresso, CURSO, publicadas)).toBe(1);
  });

  it('é zero para curso nunca aberto', () => {
    expect(contarConcluidas({}, CURSO, publicadas)).toBe(0);
  });

  it('não conta a aula opcional, nem quando ela está concluída', () => {
    // O ponto do sinalizador: com as três alternativas de instalação no total,
    // quem faz uma delas nunca chega aos 100%.
    const comAlternativas = [aula('windows', true), aula('linux', true), ...publicadas];
    let progresso = definirEstado({}, CURSO, 'linux', 'concluida');
    for (const cada of publicadas) progresso = definirEstado(progresso, CURSO, cada.slug, 'concluida');

    expect(contarConcluidas(progresso, CURSO, comAlternativas)).toBe(3);
    expect(contaveis(comAlternativas)).toEqual(publicadas);
  });
});

describe('proximaAula', () => {
  const publicadas = [aula('pdk'), aula('verilog'), aula('cocotb')];

  it('retoma na última aberta', () => {
    const progresso = registrarVisita({}, CURSO, { tipo: 'aula', slug: 'verilog' });
    expect(proximaAula(progresso, CURSO, publicadas)).toBe('verilog');
  });

  it('cai na primeira pendente quando a última saiu do ar', () => {
    let progresso = registrarVisita({}, CURSO, { tipo: 'aula', slug: 'aula-removida' });
    progresso = definirEstado(progresso, CURSO, 'pdk', 'concluida');

    expect(proximaAula(progresso, CURSO, publicadas)).toBe('verilog');
  });

  it('começa do início quando não há nada gravado', () => {
    expect(proximaAula({}, CURSO, publicadas)).toBe('pdk');
  });

  it('volta ao início quando tudo está concluído', () => {
    let progresso: Progresso = {};
    for (const cada of publicadas) progresso = definirEstado(progresso, CURSO, cada.slug, 'concluida');
    progresso = { ...progresso, [CURSO]: { ...progresso[CURSO]!, ultima: null } };

    expect(proximaAula(progresso, CURSO, publicadas)).toBe('pdk');
  });

  it('honra a última aberta mesmo sendo opcional, mas não a oferece como pendente', () => {
    const comAlternativa = [aula('windows', true), ...publicadas];

    expect(
      proximaAula(
        registrarVisita({}, CURSO, { tipo: 'aula', slug: 'windows' }),
        CURSO,
        comAlternativa,
      ),
    ).toBe(
      'windows',
    );
    expect(
      proximaAula(
        registrarVisita({}, CURSO, { tipo: 'aula', slug: 'saiu-do-ar' }),
        CURSO,
        comAlternativa,
      ),
    ).toBe('pdk');
  });

  it('devolve null para curso sem aula publicada', () => {
    expect(proximaAula({}, CURSO, [])).toBeNull();
  });
});

describe('tentativas de quiz', () => {
  it('70 passa e 69 não passa', () => {
    const com69 = registrarTentativa({}, CURSO, 'quiz', 69)
    const com70 = registrarTentativa(com69, CURSO, 'outro-quiz', 70)

    expect(quizConcluido(com70, CURSO, 'quiz', 70)).toBe(false)
    expect(quizConcluido(com70, CURSO, 'outro-quiz', 70)).toBe(true)
  })

  it('preserva a melhor nota e incrementa todas as tentativas', () => {
    let progresso = registrarTentativa({}, CURSO, 'quiz', 80)
    progresso = registrarTentativa(progresso, CURSO, 'quiz', 40)

    expect(melhorNota(progresso, CURSO, 'quiz')).toBe(80)
    expect(tentativasDoQuiz(progresso, CURSO, 'quiz')).toBe(2)
  })

  it('reavalia a conclusão quando a nota mínima muda', () => {
    const progresso = registrarTentativa({}, CURSO, 'quiz', 80)

    expect(quizConcluido(progresso, CURSO, 'quiz', 70)).toBe(true)
    expect(quizConcluido(progresso, CURSO, 'quiz', 90)).toBe(false)
  })
})

describe('progresso por atividade', () => {
  const atividades = [
    {
      tipo: 'aula' as const,
      slug: 'opcional',
      titulo: 'Alternativa',
      opcional: true,
      duracao_seg: null,
    },
    {
      tipo: 'aula' as const,
      slug: 'aula',
      titulo: 'Aula',
      opcional: false,
      duracao_seg: 300,
    },
    {
      tipo: 'quiz' as const,
      slug: 'quiz',
      titulo: 'Quiz',
      nota_minima: 70,
    },
  ]

  it('conta aulas obrigatórias e quizzes aprovados', () => {
    let progresso = definirEstado({}, CURSO, 'opcional', 'concluida')
    progresso = definirEstado(progresso, CURSO, 'aula', 'concluida')
    progresso = registrarTentativa(progresso, CURSO, 'quiz', 70)

    expect(contarAtividadesConcluidas(progresso, CURSO, atividades)).toBe(2)
  })

  it('retoma a última atividade publicada e depois cai na primeira pendente', () => {
    const visitado = registrarVisita({}, CURSO, { tipo: 'quiz', slug: 'quiz' })
    expect(proximaAtividade(visitado, CURSO, atividades)).toEqual(atividades[2])

    let semUltima = definirEstado({}, CURSO, 'aula', 'concluida')
    semUltima = registrarTentativa(semUltima, CURSO, 'quiz', 50)
    expect(proximaAtividade(semUltima, CURSO, atividades)).toEqual(atividades[2])
  })
})
