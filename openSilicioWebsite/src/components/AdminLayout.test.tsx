import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuth } from '../contexts/AuthContext'
import AdminLayout from './AdminLayout'

vi.mock('../contexts/AuthContext', () => ({ useAuth: vi.fn() }))

const logout = vi.fn()

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <AdminLayout><div>Conteúdo</div></AdminLayout>
    </MemoryRouter>,
  )
}

describe('AdminLayout mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout,
    })
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  })

  it('abre a navegação mobile e fecha depois de escolher uma rota', async () => {
    const user = userEvent.setup()
    renderAdminLayout()

    await user.click(screen.getByRole('button', { name: 'Abrir navegação' }))
    expect(screen.getByRole('link', { name: 'Cursos' })).toBeVisible()

    await user.click(screen.getByRole('link', { name: 'Cursos' }))
    await waitFor(() => {
      expect(screen.queryByRole('link', { name: 'Cursos' })).not.toBeInTheDocument()
    })
  })

  it('move as ações do site e da sessão para o menu mobile', async () => {
    const user = userEvent.setup()
    renderAdminLayout()
    expect(screen.queryByRole('link', { name: 'Ver site' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Abrir navegação' }))
    expect(screen.getByRole('link', { name: 'Ver site' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeVisible()
  })
})
