/**
 * Progresso de leitura dos cursos, guardado no navegador de quem lê.
 *
 * Não existe conta de visitante no site, só o login do admin, então não há onde
 * gravar isso do lado do servidor. As consequências são assumidas: o progresso
 * não acompanha o leitor entre dispositivos, limpar o navegador apaga tudo, e
 * nenhum dado de conclusão chega ao autor.
 *
 * A parte com regra fica aqui, pura, separada do acesso ao localStorage e do
 * React, para dar para testar sem DOM. Quem usa é o hook useProgresso.
 */

export type EstadoAula = 'concluida' | 'nao-concluida';

export interface ProgressoCurso {
  /** Chaveado pelo slug da aula. */
  aulas: Record<string, EstadoAula>;
  /** Slug da última aula aberta, para o botão "retomar". */
  ultima: string | null;
}

export type Progresso = Record<string, ProgressoCurso>;

/** O mínimo que as contas precisam saber de uma aula publicada. */
export interface AulaPublicada {
  slug: string;
  opcional: boolean;
}

export const CHAVE_DE_ARMAZENAMENTO = 'opensilicio-cursos-progresso';

/**
 * As aulas que entram na conta do progresso.
 *
 * A aula opcional é uma alternativa às irmãs — instalar no Windows, no Linux ou
 * no macOS — e o leitor faz uma só. Contando todas, ninguém chegaria a 100%.
 * Esta é a única função que conhece a regra: quem precisa de um total, de um
 * tempo restante ou de uma lista de pendentes filtra por aqui, e não na página.
 */
export const contaveis = <T extends AulaPublicada>(publicadas: readonly T[]): T[] =>
  publicadas.filter((aula) => !aula.opcional);

const cursoVazio = (): ProgressoCurso => ({ aulas: {}, ultima: null });

/**
 * Descarta o que não tiver a forma esperada em vez de confiar.
 *
 * O valor vem de um localStorage que outra versão do site pode ter escrito, ou
 * que alguém editou à mão. Uma leitura ingênua com JSON.parse quebraria a
 * página inteira do curso por causa de um campo torto.
 */
export function lerProgresso(bruto: string | null): Progresso {
  if (!bruto) return {};

  let analisado: unknown;
  try {
    analisado = JSON.parse(bruto);
  } catch {
    return {};
  }

  if (typeof analisado !== 'object' || analisado === null || Array.isArray(analisado)) return {};

  const saida: Progresso = {};
  for (const [curso, valor] of Object.entries(analisado as Record<string, unknown>)) {
    if (typeof valor !== 'object' || valor === null) continue;

    const { aulas, ultima } = valor as { aulas?: unknown; ultima?: unknown };
    if (typeof aulas !== 'object' || aulas === null || Array.isArray(aulas)) continue;

    const limpas: Record<string, EstadoAula> = {};
    for (const [aula, estado] of Object.entries(aulas as Record<string, unknown>)) {
      if (estado === 'concluida' || estado === 'nao-concluida') limpas[aula] = estado;
    }

    saida[curso] = { aulas: limpas, ultima: typeof ultima === 'string' ? ultima : null };
  }

  return saida;
}

/**
 * Marca automática, disparada quando o leitor chega ao pé da aula.
 *
 * Só escreve quando não há decisão explícita gravada. É isso que faz o botão de
 * desmarcar valer: sem a checagem, a próxima rolagem desfaria a escolha de quem
 * desmarcou.
 */
export function marcarAutomaticamente(
  progresso: Progresso,
  curso: string,
  aula: string,
): Progresso {
  const atual = progresso[curso] ?? cursoVazio();
  if (atual.aulas[aula] !== undefined) return progresso;

  return {
    ...progresso,
    [curso]: { ...atual, aulas: { ...atual.aulas, [aula]: 'concluida' } },
  };
}

/** Marca ou desmarca no botão. A escolha explícita sempre vence. */
export function definirEstado(
  progresso: Progresso,
  curso: string,
  aula: string,
  estado: EstadoAula,
): Progresso {
  const atual = progresso[curso] ?? cursoVazio();
  return {
    ...progresso,
    [curso]: { ...atual, aulas: { ...atual.aulas, [aula]: estado } },
  };
}

export function registrarVisita(progresso: Progresso, curso: string, aula: string): Progresso {
  const atual = progresso[curso] ?? cursoVazio();
  if (atual.ultima === aula) return progresso;

  return { ...progresso, [curso]: { ...atual, ultima: aula } };
}

/**
 * Apaga tudo o que está gravado de um curso: as concluídas, os
 * 'nao-concluida' explícitos e a última aula aberta.
 *
 * Tira a chave inteira em vez de zerar os campos, senão o curso continuaria
 * com um `ultima` e um mapa vazios, e `proximaAula` teria que tratar esse
 * meio-termo. Sem nada gravado devolve o mesmo objeto, para o hook não
 * regravar o armazenamento à toa.
 */
export function zerarCurso(progresso: Progresso, curso: string): Progresso {
  if (!(curso in progresso)) return progresso;

  const { [curso]: _apagado, ...resto } = progresso;
  return resto;
}

/**
 * Há o que zerar neste curso?
 *
 * Só abrir uma aula já grava a `ultima`, e isso não é progresso: quem ainda
 * não marcou nem desmarcou nada não tem o que apagar, e o botão de zerar não
 * teria por que aparecer. Por isso a pergunta é sobre o mapa de aulas, onde
 * entram as duas decisões do leitor e mais nada.
 */
export function temProgressoGravado(progresso: Progresso, curso: string): boolean {
  const doCurso = progresso[curso];
  return doCurso !== undefined && Object.keys(doCurso.aulas).length > 0;
}

export function estaConcluida(progresso: Progresso, curso: string, aula: string): boolean {
  return progresso[curso]?.aulas[aula] === 'concluida';
}

/**
 * Quantas das aulas que contam foram concluídas.
 *
 * O denominador é a lista de aulas publicadas que a página passa, menos as
 * opcionais, e não o que está gravado: uma aula que saiu do ar não pode
 * continuar contando, e uma que entrou tem que aumentar o total. Publicar uma
 * aula nova baixa a porcentagem de todo mundo, o que é honesto: o curso cresceu.
 *
 * A aula opcional concluída continua gravada e continua mostrando o tique no
 * currículo; ela só não mexe na porcentagem.
 */
export function contarConcluidas(
  progresso: Progresso,
  curso: string,
  publicadas: readonly AulaPublicada[],
): number {
  const doCurso = progresso[curso];
  if (!doCurso) return 0;

  return contaveis(publicadas).filter((aula) => doCurso.aulas[aula.slug] === 'concluida').length;
}

/**
 * Por onde retomar: a última aula aberta, se ainda estiver publicada, senão a
 * primeira que falta concluir, senão a primeira do curso.
 *
 * A última aberta vale mesmo sendo opcional — quem parou no meio da aula de
 * instalar no Windows quer voltar para lá. Já a busca pela pendente pula as
 * opcionais, senão o botão mandaria o leitor para a alternativa que ele não
 * escolheu.
 */
export function proximaAula(
  progresso: Progresso,
  curso: string,
  publicadas: readonly AulaPublicada[],
): string | null {
  if (publicadas.length === 0) return null;

  const doCurso = progresso[curso];
  if (!doCurso) return publicadas[0]!.slug;

  if (doCurso.ultima && publicadas.some((aula) => aula.slug === doCurso.ultima)) {
    return doCurso.ultima;
  }

  const pendente = contaveis(publicadas).find((aula) => doCurso.aulas[aula.slug] !== 'concluida');
  return pendente?.slug ?? publicadas[0]!.slug;
}
