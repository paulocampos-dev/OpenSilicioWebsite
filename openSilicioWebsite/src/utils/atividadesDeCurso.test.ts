import { describe, expect, it } from 'vitest'
import type { ModuloNaArvore } from '../types'
import { atividadesDoModulo, hrefDaAtividade } from './atividadesDeCurso'

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
