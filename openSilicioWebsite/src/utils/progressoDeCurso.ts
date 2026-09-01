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

export const CHAVE_DE_ARMAZENAMENTO = 'opensilicio-cursos-progresso';

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

export function estaConcluida(progresso: Progresso, curso: string, aula: string): boolean {
  return progresso[curso]?.aulas[aula] === 'concluida';
}

/**
 * Quantas das aulas publicadas foram concluídas.
 *
 * O denominador é a lista de aulas publicadas que a página passa, e não o que
 * está gravado: uma aula que saiu do ar não pode continuar contando, e uma que
 * entrou tem que aumentar o total. Publicar uma aula nova baixa a porcentagem
 * de todo mundo, o que é honesto: o curso cresceu.
 */
export function contarConcluidas(
  progresso: Progresso,
  curso: string,
  slugsPublicados: string[],
): number {
  const doCurso = progresso[curso];
  if (!doCurso) return 0;

  return slugsPublicados.filter((slug) => doCurso.aulas[slug] === 'concluida').length;
}

/**
 * Por onde retomar: a última aula aberta, se ainda estiver publicada, senão a
 * primeira que falta concluir, senão a primeira do curso.
 */
export function proximaAula(
  progresso: Progresso,
  curso: string,
  slugsPublicados: string[],
): string | null {
  if (slugsPublicados.length === 0) return null;

  const doCurso = progresso[curso];
  if (!doCurso) return slugsPublicados[0]!;

  if (doCurso.ultima && slugsPublicados.includes(doCurso.ultima)) return doCurso.ultima;

  const pendente = slugsPublicados.find((slug) => doCurso.aulas[slug] !== 'concluida');
  return pendente ?? slugsPublicados[0]!;
}
