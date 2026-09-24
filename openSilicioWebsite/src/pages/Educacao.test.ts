import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cartaoDeCurso, cartaoDeRecurso } from './Educacao'
import Educacao from './Educacao'
import { cursosApi, educationApi } from '../services/api'
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
  updated_at: '2026-06-10T12:00:00.000Z',
}

const recursoAntigo: EducationResource = {
  id: 'r2',
  title: 'Introdução ao CMOS',
  description: 'Base teórica.',
  content: '{}',
  category: 'Teóricos',
  difficulty: 'Iniciante',
  published: true,
  created_at: '2026-01-01T12:00:00.000Z',
  updated_at: '2026-01-02T12:00:00.000Z',
}

const curso: CursoNaListagem = {
  id: 'c1',
  slug: 'do-rtl-ao-gds',
  titulo: 'Do RTL ao GDS',
  descricao: 'Uma trilha completa.',
  publicado: true,
  nivel: 'Iniciante',
  created_at: '2026-07-01T12:00:00.000Z',
  updated_at: '2026-07-15T12:00:00.000Z',
  modulos: 2,
  aulas: 3,
  aulas_rascunho: 1,
  quizzes: 0,
  quizzes_rascunho: 0,
  duracao_seg: 1320,
  aulas_publicadas: [
    { id: 'a1', modulo_id: 'm1', modulo_ordem: 0, ordem: 0, slug: 'pdk', titulo: 'O que é um PDK', duracao_seg: 480, opcional: false },
    { id: 'a2', modulo_id: 'm1', modulo_ordem: 0, ordem: 1, slug: 'yosys', titulo: 'Síntese com Yosys', duracao_seg: 840, opcional: false },
  ],
  quizzes_publicados: [],
}

vi.mock('../services/api', () => ({
  educationApi: { getAll: vi.fn() },
  cursosApi: { getAll: vi.fn() },
}))

const pagination = {
  page: 1,
  limit: 100,
  total: 1,
  totalPages: 1,
  hasNext: false,
  hasPrev: false,
}

const renderEducacao = () => render(createElement(MemoryRouter, null, createElement(Educacao)))

beforeEach(() => {
  vi.mocked(educationApi.getAll).mockResolvedValue({ data: [recurso, recursoAntigo], pagination })
  vi.mocked(cursosApi.getAll).mockResolvedValue({ data: [curso], pagination })
})

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

  it('ordena e rotula o recurso pela atualização, não pela publicação', () => {
    const cartao = cartaoDeRecurso(recurso)
    expect(cartao.data).toBe(recurso.updated_at)
    expect(cartao.meta).toBe(`Atualizado ${new Date(recurso.updated_at).toLocaleDateString('pt-BR')}`)
  })

  it('o curso ordena pela atualização, sem trocar a linha de estrutura', () => {
    expect(cartaoDeCurso(curso).data).toBe(curso.updated_at)
    expect(cartaoDeCurso(curso).meta).toBe('2 módulos · 3 aulas · 22 min')
  })
})

describe('filtros mobile', () => {
  it('filtra pelo drawer e expõe um resumo removível', async () => {
    const user = userEvent.setup()
    renderEducacao()

    await user.click(await screen.findByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: 'Tutoriais' }))
    await user.click(screen.getByRole('button', { name: 'Iniciante' }))
    await user.click(screen.getByRole('button', { name: 'Ver resultados' }))

    expect(screen.getByRole('button', { name: 'Remover filtro Tutoriais' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Remover filtro Iniciante' })).toBeVisible()
    expect(screen.getByRole('link', { name: /Simulando no SiliWiz/i })).toBeVisible()
  })

  it('limpa categoria e nível sem apagar a busca', async () => {
    const user = userEvent.setup()
    renderEducacao()
    const busca = await screen.findByRole('searchbox', { name: 'Buscar recursos' })

    await user.type(busca, 'SiliWiz')
    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    await user.click(screen.getByRole('button', { name: 'Tutoriais' }))
    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }))

    expect(busca).toHaveValue('SiliWiz')
  })

  it('ordena do mais recente e permite inverter no drawer', async () => {
    const user = userEvent.setup()
    renderEducacao()

    await screen.findByRole('link', { name: /Do RTL ao GDS/i })
    const linksRecentes = screen.getAllByRole('link').map((el) => el.getAttribute('href'))
    expect(linksRecentes.indexOf('/cursos/do-rtl-ao-gds')).toBeLessThan(
      linksRecentes.indexOf('/educacao/r2'),
    )

    await user.click(screen.getByRole('button', { name: 'Filtros' }))
    const drawer = screen.getByRole('presentation')
    await user.click(within(drawer).getByRole('button', { name: 'Mais antigos' }))
    await user.click(within(drawer).getByRole('button', { name: 'Ver resultados' }))

    const linksAntigos = screen.getAllByRole('link').map((el) => el.getAttribute('href'))
    expect(linksAntigos.indexOf('/educacao/r2')).toBeLessThan(
      linksAntigos.indexOf('/cursos/do-rtl-ao-gds'),
    )
    expect(screen.getByRole('button', { name: 'Voltar para mais recentes' })).toBeVisible()
  })
})
