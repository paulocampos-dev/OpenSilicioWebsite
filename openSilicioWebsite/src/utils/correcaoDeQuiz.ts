import type { QuizQuestao } from '../types'

export interface CorrecaoDoQuiz {
  acertos: number
  total: number
  nota: number
  porQuestao: Array<{
    questaoId: string
    correta: boolean
    alternativaCorretaId: string
  }>
}

export function corrigirQuiz(
  questoes: readonly QuizQuestao[],
  respostas: Readonly<Record<string, string>>,
): CorrecaoDoQuiz {
  const porQuestao = questoes.map((questao) => {
    const alternativaCorreta = questao.alternativas.find((alternativa) => alternativa.correta)
    const alternativaCorretaId = alternativaCorreta?.id ?? ''
    return {
      questaoId: questao.id,
      correta: respostas[questao.id] === alternativaCorretaId,
      alternativaCorretaId,
    }
  })
  const acertos = porQuestao.filter((questao) => questao.correta).length
  const total = questoes.length

  return {
    acertos,
    total,
    nota: total === 0 ? 0 : Math.round((acertos / total) * 100),
    porQuestao,
  }
}
