import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Dashboard from './Dashboard'

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'AdmOpen' } }),
}))

describe('Dashboard no celular', () => {
  it('mantém os atalhos com alvos de toque confortáveis', () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    )

    expect(screen.getAllByRole('link', { name: 'Ver Todos' })[0]).toHaveStyle({ minHeight: '44px' })
    expect(screen.getAllByRole('link', { name: 'Criar Novo' })[0]).toHaveStyle({ minHeight: '44px' })
  })
})
