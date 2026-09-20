import { describe, expect, it } from 'vitest'
import type { QuizQuestao } from '../types'
import { corrigirQuiz } from './correcaoDeQuiz'

const questoes: QuizQuestao[] = Array.from({ length: 4 }, (_, indice) => ({
  id: `q${indice + 1}`,
  ordem: indice,
  enunciado: `Questão ${indice + 1}`,
  explicacao: `Explicação ${indice + 1}`,
  alternativas: Array.from({ length: 4 }, (_, alternativa) => ({
    id: `q${indice + 1}-a${alternativa + 1}`,
    ordem: alternativa,
    texto: `Alternativa ${alternativa + 1}`,
    correta: alternativa === 0,
  })),
}))

describe('corrigirQuiz', () => {
  it('calcula 100 para quatro acertos', () => {
    const respostas = Object.fromEntries(questoes.map((questao) => [questao.id, `${questao.id}-a1`]))
    expect(corrigirQuiz(questoes, respostas).nota).toBe(100)
  })

  it('arredonda três de quatro para 75', () => {
    const respostas = Object.fromEntries(questoes.map((questao) => [questao.id, `${questao.id}-a1`]))
    respostas.q4 = 'q4-a2'

    expect(corrigirQuiz(questoes, respostas)).toMatchObject({ acertos: 3, total: 4, nota: 75 })
  })

  it('conta uma questão sem resposta como errada e informa a correta', () => {
    const correcao = corrigirQuiz(questoes, { q1: 'q1-a1' })

    expect(correcao.acertos).toBe(1)
    expect(correcao.porQuestao[1]).toEqual({
      questaoId: 'q2',
      correta: false,
      alternativaCorretaId: 'q2-a1',
    })
  })

  it('devolve zero para um quiz sem questões', () => {
    expect(corrigirQuiz([], {})).toEqual({ acertos: 0, total: 0, nota: 0, porQuestao: [] })
  })
})
