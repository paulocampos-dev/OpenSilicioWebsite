import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext'
import { authApi } from '../services/api'

vi.mock('../services/api', () => ({
  authApi: {
    login: vi.fn(),
    verifyToken: vi.fn(),
  },
}))

function Probe() {
  const { isAuthenticated, isLoading, user, login, logout } = useAuth()
  return (
    <div>
      <span data-testid="status">{isLoading ? 'loading' : isAuthenticated ? 'authed' : 'anon'}</span>
      <span data-testid="user">{user?.username ?? ''}</span>
      <button onClick={() => login('admin', 'secret').catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('starts anonymous when there is no stored token', async () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anon'))
  })

  it('stores the token and user on successful login', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'tok-123',
      user: { id: '1', username: 'admin' },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anon'))

    await act(async () => {
      await userEvent.click(screen.getByText('login'))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('authed')
    expect(screen.getByTestId('user')).toHaveTextContent('admin')
    expect(localStorage.getItem('token')).toBe('tok-123')
  })

  it('does not authenticate when login rejects', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new Error('bad credentials'))

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anon'))

    await act(async () => {
      await userEvent.click(screen.getByText('login'))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('anon')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('clears stored auth on logout', async () => {
    vi.mocked(authApi.login).mockResolvedValue({
      token: 'tok-123',
      user: { id: '1', username: 'admin' },
    })

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>
    )
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anon'))
    await act(async () => {
      await userEvent.click(screen.getByText('login'))
    })
    expect(screen.getByTestId('status')).toHaveTextContent('authed')

    await act(async () => {
      await userEvent.click(screen.getByText('logout'))
    })

    expect(screen.getByTestId('status')).toHaveTextContent('anon')
    expect(localStorage.getItem('token')).toBeNull()
  })
})
