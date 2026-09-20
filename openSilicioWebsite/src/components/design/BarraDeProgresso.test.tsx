import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import BarraDeProgresso from './BarraDeProgresso'

describe('BarraDeProgresso', () => {
  it('descreve o total como atividades, porque aulas e quizzes entram na conta', () => {
    render(<BarraDeProgresso concluidas={1} total={3} />)

    expect(screen.getByRole('progressbar')).toHaveAccessibleName(
      '1 de 3 atividades concluídas',
    )
  })
})
