import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import About from './About'
import Blog from './Blog'
import Cursos from './Cursos'
import Educacao from './Educacao'
import WikiList from './WikiList'

const api = vi.hoisted(() => ({
  settings: vi.fn(),
  blogAll: vi.fn(),
  blogCategories: vi.fn(),
  cursosAll: vi.fn(),
  educationAll: vi.fn(),
  wikiAll: vi.fn(),
  wikiPending: vi.fn(),
}))

vi.mock('../services/api', () => ({
  settingsApi: { getAll: api.settings },
  blogApi: { getAll: api.blogAll, getCategories: api.blogCategories },
  cursosApi: { getAll: api.cursosAll },
  educationApi: { getAll: api.educationAll },
  wikiApi: { getAll: api.wikiAll, getPendingGrouped: api.wikiPending },
}))

const pagination = {
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false,
}

const renderPage = (page: React.ReactNode) => render(<MemoryRouter>{page}</MemoryRouter>)

beforeEach(() => {
  api.settings.mockResolvedValue({
    contact_email: '',
    instagram_url: '',
    linkedin_url: '',
    address: '',
    featured_education_ids: [],
    featured_blog_ids: [],
    about_title: 'Sobre o OpenSilício',
    about_content: '{}',
    about_mission: '{}',
    about_vision: '{}',
    about_history: '{}',
    about_team_members: [{ name: 'Ada', role: 'Pesquisa', photo_url: '' }],
  })
  api.blogAll.mockResolvedValue({ data: [], pagination })
  api.blogCategories.mockResolvedValue([])
  api.cursosAll.mockResolvedValue({ data: [], pagination })
  api.educationAll.mockResolvedValue({ data: [], pagination })
  api.wikiAll.mockResolvedValue({ data: [], pagination })
  api.wikiPending.mockResolvedValue([])
})

afterEach(cleanup)

describe('títulos principais públicos', () => {
  it.each([
    ['Educação', <Educacao />],
    ['Blog', <Blog />],
    ['Cursos', <Cursos />],
    ['Wiki', <WikiList />],
  ])('%s tem exatamente um h1', async (_name, page) => {
    renderPage(page)
    expect(await screen.findAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('estrutura as seções principais da página Sobre', async () => {
    renderPage(<About />)

    expect(await screen.findAllByRole('heading', { level: 1 })).toHaveLength(1)
    for (const name of ['Nossa Missão', 'Nossa Visão', 'Nossa História', 'Nossa Equipe']) {
      await waitFor(() => expect(screen.getByRole('heading', { name, level: 2 })).toBeVisible())
    }
    expect(screen.getByRole('heading', { name: 'Ada', level: 3 })).toBeVisible()
  })
})
