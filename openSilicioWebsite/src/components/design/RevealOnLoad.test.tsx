import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RevealOnLoad from './RevealOnLoad'

const preference = vi.hoisted(() => ({ mobile: false, reduce: false }))

vi.mock('@mui/material', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@mui/material')>()),
  useMediaQuery: () => preference.mobile,
}))

vi.mock('framer-motion', () => ({
  useReducedMotion: () => preference.reduce,
  motion: {
    div: ({ initial, animate, transition, children, ...props }: {
      initial: false | { opacity: number; y?: number }
      animate: { opacity: number; y?: number }
      transition?: { duration?: number }
      children?: React.ReactNode
      'data-testid'?: string
    }) => {
      const state = initial === false ? animate : initial
      return (
        <div
          {...props}
          data-duration={transition?.duration}
          style={{
            opacity: state.opacity,
            transform: state.y ? `translateY(${state.y}px)` : 'none',
          }}
        >
          {children}
        </div>
      )
    },
  },
}))

beforeEach(() => {
  preference.mobile = false
  preference.reduce = false
})

describe('RevealOnLoad', () => {
  it.each([
    ['mobile', true, false],
    ['movimento reduzido', false, true],
  ])('mostra imediatamente com %s', (_name, mobile, reduce) => {
    preference.mobile = mobile
    preference.reduce = reduce

    render(<RevealOnLoad data-testid="reveal">Conteúdo</RevealOnLoad>)

    expect(screen.getByTestId('reveal')).toHaveStyle({ opacity: '1', transform: 'none' })
  })

  it('preserva a transição curta no desktop', () => {
    render(<RevealOnLoad data-testid="reveal">Conteúdo</RevealOnLoad>)

    expect(screen.getByTestId('reveal')).toHaveStyle({ opacity: '0', transform: 'translateY(8px)' })
    expect(screen.getByTestId('reveal')).toHaveAttribute('data-duration', '0.22')
  })
})
