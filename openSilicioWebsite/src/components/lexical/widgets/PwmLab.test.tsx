import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { PwmLab } from './PwmLab'
import type { ConfiguracaoPwm } from '../utils/pwmLab'

const configuracao: ConfiguracaoPwm = {
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda quando o duty cycle passa de 25% para 75%?',
  alternativas: [
    { texto: 'A frequência triplica.', correta: false, explicacao: 'Ela permanece em 100 Hz.' },
    { texto: 'O LED parece mais brilhante.', correta: true, explicacao: 'O tempo alto aumenta.' },
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3,
}

describe('PwmLab', () => {
  it('exige uma hipótese antes de liberar a bancada', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    const slider = screen.getByRole('slider', { name: /duty cycle/i })
    expect(slider).toBeDisabled()

    await user.click(screen.getByRole('button', { name: /frequência triplica/i }))

    expect(slider).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Ela permanece em 100 Hz.')
  })

  it('atualiza onda e leituras sem persistir ou chamar rede', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    await user.click(screen.getByRole('button', { name: /led parece/i }))

    const slider = screen.getByRole('slider', { name: /duty cycle/i })
    fireEvent.change(slider, { target: { value: '75' } })

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByText('7,5 ms')).toBeInTheDocument()
    expect(screen.getByText('2,48 V')).toBeInTheDocument()
    expect(screen.getByTestId('onda-pwm')).toHaveAttribute(
      'd',
      'M0 90V10H75V90H100V10H175V90H200V10H275V90H300V10H375V90H400',
    )
  })

  it('representa o brilho no LED externo ao mudar o duty cycle', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    await user.click(screen.getByRole('button', { name: /led parece/i }))

    const led = document.querySelector<HTMLElement>('.os-pwm__led')
    if (led === null) throw new Error('LED PWM não encontrado')

    expect(led).toHaveStyle({ opacity: '0.25' })
    expect(led.querySelector('.os-pwm__led-pulso')).toBeNull()

    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } })

    expect(led).toHaveStyle({ opacity: '0.75' })
  })

  it('troca a explicação sem redefinir o ajuste atual', async () => {
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    await user.click(screen.getByRole('button', { name: /led parece/i }))
    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } })
    await user.click(screen.getByRole('button', { name: /frequência triplica/i }))

    expect(screen.getByRole('slider')).toHaveValue('75')
    expect(screen.getByRole('status')).toHaveTextContent('Ela permanece em 100 Hz.')
  })
})
