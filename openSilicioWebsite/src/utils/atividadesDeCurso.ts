import type { AtividadePublicada, ModuloNaArvore, VizinhaDeAtividade } from '../types'

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
