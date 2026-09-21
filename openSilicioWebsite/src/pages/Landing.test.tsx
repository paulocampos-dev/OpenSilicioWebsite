import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Landing from './Landing'

vi.mock('../services/api', () => ({
  settingsApi: {
    getAll: vi.fn(() => new Promise<never>(() => {})),
  },
}))

describe('Landing partners', () => {
  it('renders the Amigos da Poli and USP partner marks', () => {
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>,
    )

    expect(screen.getByRole('img', { name: 'Amigos da Poli' })).toHaveAttribute(
      'src',
      '/amigos-da-poli-logo-sem-bg.png',
    )
    expect(screen.getByRole('img', { name: 'Universidade de São Paulo' })).toHaveAttribute(
      'src',
      '/usp-logo-transp.png',
    )
  })
})
