import { describe, expect, it } from 'vitest'
import type { ModuloNaArvore } from '../types'
import { atividadesDaListagem, atividadesDoModulo, hrefDaAtividade } from './atividadesDeCurso'

const modulo: ModuloNaArvore = {
  id: 'modulo-1',
  curso_id: 'curso-1',
  ordem: 0,
  titulo: 'Portas lógicas',
  aulas: [
    {
      publicado: true,
      id: 'aula-1',
      slug: 'inversor',
      titulo: 'O inversor',
      duracao_seg: 300,
      tem_video: true,
      opcional: false,
    },
    { publicado: false, id: 'aula-2', titulo: 'Em preparação' },
    {
      publicado: true,
      id: 'aula-3',
      slug: 'nand',
      titulo: 'A porta NAND',
      duracao_seg: null,
      tem_video: false,
      opcional: true,
    },
  ],
  quizzes: [
    {
      publicado: true,
      id: 'quiz-3',
      aula_id: 'aula-3',
      slug: 'quiz-nand',
      titulo: 'Pratique NAND',
      nota_minima: 70,
      total_questoes: 3,
    },
    { publicado: false, id: 'quiz-rascunho', titulo: 'Ainda não' },
    {
      publicado: true,
      id: 'quiz-1',
      aula_id: 'aula-1',
      slug: 'quiz-inversor',
      titulo: 'Pratique o inversor',
      nota_minima: 70,
      total_questoes: 4,
    },
    {
      publicado: true,
      id: 'quiz-final',
      aula_id: null,
      slug: 'revisao',
      titulo: 'Revisão do módulo',
      nota_minima: 80,
      total_questoes: 5,
    },
  ],
}

describe('atividadesDoModulo', () => {
  it('coloca o quiz da aula logo depois dela e o quiz final no fim', () => {
    expect(atividadesDoModulo(modulo).map(({ tipo, slug }) => [tipo, slug])).toEqual([
      ['aula', 'inversor'],
      ['quiz', 'quiz-inversor'],
      ['aula', 'nand'],
      ['quiz', 'quiz-nand'],
      ['quiz', 'revisao'],
    ])
  })

  it('não transforma rascunhos em atividades públicas', () => {
    expect(atividadesDoModulo(modulo).some(({ slug }) => slug === 'quiz-rascunho')).toBe(false)
  })
})

describe('hrefDaAtividade', () => {
  it('gera as rotas distintas de quiz e aula', () => {
    expect(
      hrefDaAtividade('projeto-digital', {
        tipo: 'quiz',
        slug: 'quiz-1',
        titulo: 'Quiz 1',
        nota_minima: 70,
      }),
    ).toBe('/cursos/projeto-digital/quizzes/quiz-1')
    expect(
      hrefDaAtividade('projeto-digital', {
        tipo: 'aula',
        slug: 'mosfet',
        titulo: 'MOSFET',
        opcional: false,
        duracao_seg: null,
      }),
    ).toBe('/cursos/projeto-digital/mosfet')
  })
})

describe('atividadesDaListagem', () => {
  it('intercala quiz de aula e quiz final entre módulos', () => {
    const curso = {
      id: 'curso',
      slug: 'curso',
      titulo: 'Curso',
      descricao: 'Descrição',
      publicado: true,
      created_at: '',
      updated_at: '',
      modulos: 2,
      aulas: 3,
      aulas_rascunho: 0,
      quizzes: 2,
      quizzes_rascunho: 0,
      duracao_seg: 0,
      aulas_publicadas: [
        { id: 'a1', modulo_id: 'm1', slug: 'a1', titulo: 'A1', duracao_seg: null, opcional: false },
        { id: 'a2', modulo_id: 'm1', slug: 'a2', titulo: 'A2', duracao_seg: null, opcional: false },
        { id: 'a3', modulo_id: 'm2', slug: 'a3', titulo: 'A3', duracao_seg: null, opcional: false },
      ],
      quizzes_publicados: [
        { modulo_id: 'm1', aula_id: 'a1', slug: 'q1', titulo: 'Q1', nota_minima: 70 },
        { modulo_id: 'm1', aula_id: null, slug: 'final', titulo: 'Final', nota_minima: 70 },
      ],
    }

    expect(atividadesDaListagem(curso).map(({ tipo, slug }) => [tipo, slug])).toEqual([
      ['aula', 'a1'],
      ['quiz', 'q1'],
      ['aula', 'a2'],
      ['quiz', 'final'],
      ['aula', 'a3'],
    ])
  })
})
