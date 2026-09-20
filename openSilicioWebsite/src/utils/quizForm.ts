import type { CursoQuizInput, QuizCompleto } from '../types'

export interface AlternativaDoFormulario {
  id: string
  texto: string
  correta: boolean
}

export interface QuestaoDoFormulario {
  id: string
  enunciado: string
  explicacao: string
  alternativas: AlternativaDoFormulario[]
}

export type PosicaoQuiz =
  | { tipo: 'depois-da-aula'; aulaId: string }
  | { tipo: 'fim-do-modulo' }

export interface QuizDoFormulario {
  titulo: string
  slug: string
  moduloId: string
  posicao: PosicaoQuiz
  notaMinima: number
  publicado: boolean
  questoes: QuestaoDoFormulario[]
}

let sequenciaTemporaria = 0

function novoId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  sequenciaTemporaria += 1
  return `temporario-${sequenciaTemporaria}`
}

export function novoRascunhoDeQuestao(): QuestaoDoFormulario {
  return {
    id: novoId(),
    enunciado: '',
    explicacao: '',
    alternativas: Array.from({ length: 4 }, () => ({
      id: novoId(),
      texto: '',
      correta: false,
    })),
  }
}

export function quizExistenteParaFormulario(quiz: QuizCompleto): QuizDoFormulario {
  return {
    titulo: quiz.titulo,
    slug: quiz.slug,
    moduloId: quiz.modulo_id,
    posicao: quiz.aula_id
      ? { tipo: 'depois-da-aula', aulaId: quiz.aula_id }
      : { tipo: 'fim-do-modulo' },
    notaMinima: quiz.nota_minima,
    publicado: quiz.publicado,
    questoes: quiz.questoes.map((questao) => ({
      id: questao.id,
      enunciado: questao.enunciado,
      explicacao: questao.explicacao,
      alternativas: questao.alternativas.map((alternativa) => ({
        id: alternativa.id,
        texto: alternativa.texto,
        correta: alternativa.correta,
      })),
    })),
  }
}

export function validarQuiz(quiz: QuizDoFormulario): Record<string, string> {
  const erros: Record<string, string> = {}

  if (!quiz.titulo.trim()) erros.titulo = 'Informe o título'
  if (!quiz.slug.trim()) erros.slug = 'Informe o slug'
  else if (!/^[a-z0-9-]+$/.test(quiz.slug)) erros.slug = 'Use apenas letras minúsculas, números e hífens'
  if (!quiz.moduloId) erros.moduloId = 'Escolha o módulo'
  if (quiz.posicao.tipo === 'depois-da-aula' && !quiz.posicao.aulaId) {
    erros.posicao = 'Escolha a aula anterior ao quiz'
  }
  if (!Number.isInteger(quiz.notaMinima) || quiz.notaMinima < 0 || quiz.notaMinima > 100) {
    erros.notaMinima = 'Use uma nota entre 0 e 100'
  }
  if (quiz.questoes.length === 0) erros.questoes = 'Adicione ao menos uma questão'

  for (const questao of quiz.questoes) {
    const prefixo = `questao:${questao.id}`
    if (!questao.enunciado.trim()) erros[`${prefixo}:enunciado`] = 'Informe o enunciado'
    if (!questao.explicacao.trim()) erros[`${prefixo}:explicacao`] = 'Informe a explicação'
    if (
      questao.alternativas.length !== 4 ||
      questao.alternativas.some((alternativa) => !alternativa.texto.trim())
    ) {
      erros[`${prefixo}:alternativas`] = 'Preencha exatamente quatro alternativas'
    }
    if (questao.alternativas.filter((alternativa) => alternativa.correta).length !== 1) {
      erros[`${prefixo}:correta`] = 'Marque exatamente uma alternativa correta'
    }
  }

  return erros
}

export function paraPayload(quiz: QuizDoFormulario): CursoQuizInput {
  return {
    modulo_id: quiz.moduloId,
    aula_id: quiz.posicao.tipo === 'depois-da-aula' ? quiz.posicao.aulaId : null,
    titulo: quiz.titulo.trim(),
    slug: quiz.slug.trim(),
    nota_minima: quiz.notaMinima,
    publicado: quiz.publicado,
    questoes: quiz.questoes.map((questao) => ({
      enunciado: questao.enunciado.trim(),
      explicacao: questao.explicacao.trim(),
      alternativas: questao.alternativas.map((alternativa) => ({
        texto: alternativa.texto.trim(),
        correta: alternativa.correta,
      })),
    })),
  }
}
