import { describe, expect, it } from 'vitest'
import {
  novoRascunhoDeQuestao,
  paraPayload,
  validarQuiz,
  type QuizDoFormulario,
} from './quizForm'

function quizValido(): QuizDoFormulario {
  const questao = novoRascunhoDeQuestao()
  return {
    titulo: 'Quiz: células padrão',
    slug: 'quiz-celulas-padrao',
    moduloId: 'modulo-1',
    posicao: { tipo: 'depois-da-aula', aulaId: 'aula-1' },
    notaMinima: 70,
    publicado: false,
    questoes: [
      {
        ...questao,
        enunciado: 'Qual comando cria um pulso no ngspice?',
        explicacao: 'A fonte PULSE descreve a transição periódica usada na entrada.',
        alternativas: questao.alternativas.map((alternativa, indice) => ({
          ...alternativa,
          texto: ['PULSE', 'DC', 'AC', 'MODEL'][indice]!,
          correta: indice === 0,
        })),
      },
    ],
  }
}

describe('quizForm', () => {
  it('cria uma questão com ids estáveis e quatro alternativas vazias', () => {
    const questao = novoRascunhoDeQuestao()

    expect(questao.id).toBeTruthy()
    expect(questao.alternativas).toHaveLength(4)
    expect(new Set(questao.alternativas.map((alternativa) => alternativa.id)).size).toBe(4)
    expect(questao.alternativas.every((alternativa) => !alternativa.texto && !alternativa.correta)).toBe(true)
  })

  it('aponta campos gerais obrigatórios e a ausência de questões', () => {
    const erros = validarQuiz({
      titulo: ' ',
      slug: '',
      moduloId: '',
      posicao: { tipo: 'fim-do-modulo' },
      notaMinima: 70,
      publicado: false,
      questoes: [],
    })

    expect(erros).toMatchObject({
      titulo: 'Informe o título',
      slug: 'Informe o slug',
      moduloId: 'Escolha o módulo',
      questoes: 'Adicione ao menos uma questão',
    })
  })

  it('mantém os erros da questão ligados ao id estável', () => {
    const quiz = quizValido()
    const id = quiz.questoes[0]!.id
    quiz.questoes[0] = {
      ...quiz.questoes[0]!,
      enunciado: '',
      explicacao: '',
      alternativas: quiz.questoes[0]!.alternativas.map((alternativa, indice) => ({
        ...alternativa,
        texto: indice === 3 ? '' : alternativa.texto,
        correta: false,
      })),
    }

    expect(validarQuiz(quiz)).toMatchObject({
      [`questao:${id}:enunciado`]: 'Informe o enunciado',
      [`questao:${id}:explicacao`]: 'Informe a explicação',
      [`questao:${id}:alternativas`]: 'Preencha exatamente quatro alternativas',
      [`questao:${id}:correta`]: 'Marque exatamente uma alternativa correta',
    })
  })

  it('recusa duas alternativas corretas', () => {
    const quiz = quizValido()
    const id = quiz.questoes[0]!.id
    quiz.questoes[0]!.alternativas[1]!.correta = true

    expect(validarQuiz(quiz)[`questao:${id}:correta`]).toBe(
      'Marque exatamente uma alternativa correta',
    )
  })

  it('converte um quiz válido em payload aparado com nota mínima de 70%', () => {
    const quiz = quizValido()
    quiz.titulo = `  ${quiz.titulo}  `
    quiz.questoes[0]!.enunciado = `  ${quiz.questoes[0]!.enunciado}  `

    expect(validarQuiz(quiz)).toEqual({})
    expect(paraPayload(quiz)).toEqual({
      modulo_id: 'modulo-1',
      aula_id: 'aula-1',
      titulo: 'Quiz: células padrão',
      slug: 'quiz-celulas-padrao',
      nota_minima: 70,
      publicado: false,
      questoes: [
        {
          enunciado: 'Qual comando cria um pulso no ngspice?',
          explicacao: 'A fonte PULSE descreve a transição periódica usada na entrada.',
          alternativas: [
            { texto: 'PULSE', correta: true },
            { texto: 'DC', correta: false },
            { texto: 'AC', correta: false },
            { texto: 'MODEL', correta: false },
          ],
        },
      ],
    })
  })

  it('converte a posição final do módulo em aula nula', () => {
    const quiz = quizValido()
    quiz.posicao = { tipo: 'fim-do-modulo' }

    expect(paraPayload(quiz).aula_id).toBeNull()
  })
})
