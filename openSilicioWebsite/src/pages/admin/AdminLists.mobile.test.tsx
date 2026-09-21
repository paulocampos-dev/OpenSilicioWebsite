import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BlogList from './BlogList'
import CursoList from './CursoList'
import EducationList from './EducationList'
import WikiList from './WikiList'

const api = vi.hoisted(() => ({
  blogGetAll: vi.fn(),
  educationGetAll: vi.fn(),
  cursoGetAll: vi.fn(),
  wikiGetAll: vi.fn(),
  pending: vi.fn(),
}))

vi.mock('../../services/api', () => ({
  blogApi: { getAll: api.blogGetAll, update: vi.fn(), delete: vi.fn() },
  educationApi: { getAll: api.educationGetAll, update: vi.fn(), delete: vi.fn() },
  cursosApi: { getAllAdmin: api.cursoGetAll, delete: vi.fn() },
  wikiApi: { getAll: api.wikiGetAll, getPendingLinks: api.pending, update: vi.fn(), delete: vi.fn() },
}))

const pagination = { page: 1, limit: 100, total: 1, totalPages: 1, hasNext: false, hasPrev: false }
const dates = { created_at: '2026-09-01T00:00:00.000Z', updated_at: '2026-09-01T00:00:00.000Z' }

function renderPage(page: React.ReactNode) {
  return render(<MemoryRouter>{page}</MemoryRouter>)
}

describe('listas administrativas no mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.pending.mockResolvedValue([])
    api.cursoGetAll.mockResolvedValue({
      data: [{
        id: 'curso-1', slug: 'projeto-digital', titulo: 'Projeto Digital', descricao: 'Curso',
        publicado: false, nivel: 'Iniciante', modulos: 6, aulas: 12, aulas_rascunho: 8,
        quizzes: 4, quizzes_rascunho: 4, duracao_seg: 3600, aulas_publicadas: [],
        quizzes_publicados: [], ...dates,
      }],
      pagination,
    })
    api.blogGetAll.mockResolvedValue({
      data: [{
        id: 'post-1', slug: 'chip-aberto', title: 'Chip aberto', excerpt: 'Resumo', content: '{}',
        author: 'OpenSilício', category: 'Notícias', published: false, ...dates,
      }],
      pagination,
    })
    api.educationGetAll.mockResolvedValue({
      data: [{
        id: 'recurso-1', title: 'Guia de síntese', description: 'Descrição', content: '{}',
        category: 'Guias', published: false, ...dates,
      }],
      pagination,
    })
    api.wikiGetAll.mockResolvedValue({
      data: [{
        id: 'wiki-1', term: 'Síntese', slug: 'sintese', definition: 'Transformação de RTL.',
        content: '{}', published: false, ...dates,
      }],
      pagination,
    })
  })

  it('expõe todas as ações de um curso', async () => {
    const user = userEvent.setup()
    renderPage(<CursoList />)
    await user.click(await screen.findByRole('button', { name: 'Ações de Projeto Digital' }))
    expect(screen.getByRole('menuitem', { name: 'Editar estrutura' })).toHaveAttribute('href', '/admin/cursos/projeto-digital/estrutura')
    expect(screen.getByRole('menuitem', { name: 'Editar curso' })).toHaveAttribute('href', '/admin/cursos/editar/curso-1')
    expect(screen.getByRole('menuitem', { name: 'Deletar' })).toBeVisible()
  })

  it.each([
    ['post', <BlogList />, 'Chip aberto', '/admin/blog/edit/post-1'],
    ['recurso', <EducationList />, 'Guia de síntese', '/admin/educacao/edit/recurso-1'],
    ['verbete', <WikiList />, 'Síntese', '/admin/wiki/edit/wiki-1'],
  ])('expõe publicar, editar e deletar para %s em rascunho', async (_tipo, page, title, href) => {
    const user = userEvent.setup()
    renderPage(page)
    await user.click(await screen.findByRole('button', { name: `Ações de ${title}` }))
    expect(screen.getByRole('menuitem', { name: 'Publicar' })).toBeVisible()
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveAttribute('href', href)
    expect(screen.getByRole('menuitem', { name: 'Deletar' })).toBeVisible()
  })
})
