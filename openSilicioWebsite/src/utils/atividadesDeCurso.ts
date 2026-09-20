import type {
  AtividadePublicada,
  CursoNaListagem,
  ModuloNaArvore,
  VizinhaDeAtividade,
} from '../types'

/** Intercala quizzes associados às aulas e deixa o quiz de revisão no fim. */
export function atividadesDoModulo(modulo: ModuloNaArvore): AtividadePublicada[] {
  const quizzesPublicados = modulo.quizzes.filter((quiz) => quiz.publicado)
  const atividades: AtividadePublicada[] = []

  for (const aula of modulo.aulas) {
    if (aula.publicado) {
      atividades.push({
        tipo: 'aula',
        slug: aula.slug,
        titulo: aula.titulo,
        opcional: aula.opcional,
        duracao_seg: aula.duracao_seg,
      })
    }

    const quiz = quizzesPublicados.find((item) => item.aula_id === aula.id)
    if (quiz) {
      atividades.push({
        tipo: 'quiz',
        slug: quiz.slug,
        titulo: quiz.titulo,
        nota_minima: quiz.nota_minima,
      })
    }
  }

  for (const quiz of quizzesPublicados) {
    if (quiz.aula_id === null) {
      atividades.push({
        tipo: 'quiz',
        slug: quiz.slug,
        titulo: quiz.titulo,
        nota_minima: quiz.nota_minima,
      })
    }
  }

  return atividades
}

export function hrefDaAtividade(
  cursoSlug: string,
  atividade: AtividadePublicada | VizinhaDeAtividade,
): string {
  return atividade.tipo === 'quiz'
    ? `/cursos/${cursoSlug}/quizzes/${atividade.slug}`
    : `/cursos/${cursoSlug}/${atividade.slug}`
}

/** Reconstrói a ordem pública do índice usando os resumos leves da API. */
export function atividadesDaListagem(curso: CursoNaListagem): AtividadePublicada[] {
  const fimDoModulo = Number.MAX_SAFE_INTEGER
  const posicionadas = [
    ...curso.aulas_publicadas.map((aula) => ({
      atividade: {
        tipo: 'aula' as const,
        slug: aula.slug,
        titulo: aula.titulo,
        opcional: aula.opcional,
        duracao_seg: aula.duracao_seg,
      },
      moduloOrdem: aula.modulo_ordem,
      posicaoOrdem: aula.ordem,
      tipoOrdem: 0,
      desempate: aula.id,
    })),
    ...curso.quizzes_publicados.map((quiz) => ({
      atividade: {
        tipo: 'quiz' as const,
        slug: quiz.slug,
        titulo: quiz.titulo,
        nota_minima: quiz.nota_minima,
      },
      moduloOrdem: quiz.modulo_ordem,
      posicaoOrdem: quiz.aula_ordem ?? fimDoModulo,
      tipoOrdem: quiz.aula_id === null ? 2 : 1,
      desempate: quiz.slug,
    })),
  ]

  posicionadas.sort(
    (a, b) =>
      a.moduloOrdem - b.moduloOrdem ||
      a.posicaoOrdem - b.posicaoOrdem ||
      a.tipoOrdem - b.tipoOrdem ||
      a.desempate.localeCompare(b.desempate),
  )

  return posicionadas.map(({ atividade }) => atividade)
}
