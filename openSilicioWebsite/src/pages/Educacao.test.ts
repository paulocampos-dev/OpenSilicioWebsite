import { describe, it, expect } from 'vitest'
import { cartaoDeCurso, cartaoDeRecurso } from './Educacao'
import type { CursoNaListagem, EducationResource } from '../types'

/**
 * A grade da Educação desenha uma forma só, alimentada por dois adaptadores.
 * O que estes casos protegem é a fronteira: as duas origens têm que sair com a
 * mesma forma, senão a união volta a vazar para dentro do componente.
 */

const recurso: EducationResource = {
  id: 'r1',
  title: 'Simulando no SiliWiz',
  description: 'Um tutorial curto.',
  content: '{}',
  category: 'Tutoriais',
  difficulty: 'Iniciante',
  published: true,
  created_at: '2026-06-01T12:00:00.000Z',
  updated_at: '2026-06-01T12:00:00.000Z',
}

const curso: CursoNaListagem = {
  id: 'c1',
  slug: 'do-rtl-ao-gds',
  titulo: 'Do RTL ao GDS',
  descricao: 'Uma trilha completa.',
  publicado: true,
  nivel: 'Iniciante',
  created_at: '2026-07-01T12:00:00.000Z',
  updated_at: '2026-07-01T12:00:00.000Z',
  modulos: 2,
  aulas: 3,
  aulas_rascunho: 1,
  duracao_seg: 1320,
  aulas_publicadas: [
    { slug: 'pdk', titulo: 'O que é um PDK' },
    { slug: 'yosys', titulo: 'Síntese com Yosys' },
  ],
}

describe('adaptadores de cartão', () => {
  it('produzem exatamente as mesmas chaves', () => {
    expect(Object.keys(cartaoDeCurso(curso)).sort()).toEqual(
      Object.keys(cartaoDeRecurso(recurso)).sort(),
    )
  })

  it('mandam cada origem para o seu endereço', () => {
    expect(cartaoDeRecurso(recurso).href).toBe('/educacao/r1')
    expect(cartaoDeCurso(curso).href).toBe('/cursos/do-rtl-ao-gds')
  })

  it('o curso é um cartão só, com a estrutura na linha de metadados', () => {
    expect(cartaoDeCurso(curso).categoria).toBe('Cursos')
    expect(cartaoDeCurso(curso).meta).toBe('2 módulos · 3 aulas · 22 min')
  })

  it('os títulos das aulas entram na busca, e não no texto exibido', () => {
    const cartao = cartaoDeCurso(curso)

    // A aula não tem cartão próprio, então procurar por ela na Educação só
    // funciona se o título estiver no palheiro do curso.
    expect(cartao.buscavel).toContain('síntese com yosys')
    expect(cartao.descricao).not.toContain('Yosys')
  })

  it('categoria desconhecida cai numa aba que existe, em vez de sumir', () => {
    const antigo = { ...recurso, category: 'Categoria Que Não Existe Mais' }
    expect(cartaoDeRecurso(antigo).categoria).toBe('Guias')
  })
})
