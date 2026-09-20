import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PwmLab } from './PwmLab'
import type { ConfiguracaoPwm } from '../utils/pwmLab'

const preferenciaDeMovimento = vi.hoisted(() => ({ reduzido: false }))

vi.mock('framer-motion', () => ({
  useReducedMotion: () => preferenciaDeMovimento.reduzido,
}))

const estilosDeWidgets = readFileSync(
  resolve(process.cwd(), 'src/styles/design-system/patterns/widgets.css'),
  'utf8',
)

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
  beforeEach(() => {
    preferenciaDeMovimento.reduzido = false
    vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => {
      callback(0)
      return 1
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('empilha as leituras na faixa móvel', () => {
    const estilo = document.createElement('style')
    estilo.textContent = estilosDeWidgets
    document.head.append(estilo)

    try {
      const regraMovel = Array.from(estilo.sheet?.cssRules ?? []).find(
        (regra) => regra instanceof CSSMediaRule && regra.conditionText === '(max-width: 900px)',
      )
      expect(regraMovel).toBeInstanceOf(CSSMediaRule)
      if (!(regraMovel instanceof CSSMediaRule)) return

      const regraLeituras = Array.from(regraMovel.cssRules).find(
        (regra) => regra instanceof CSSStyleRule && regra.selectorText === '.os-pwm__leituras',
      )
      expect(regraLeituras).toBeInstanceOf(CSSStyleRule)
      if (!(regraLeituras instanceof CSSStyleRule)) return

      expect(regraLeituras.style.getPropertyValue('grid-template-columns')).toBe('1fr')
    } finally {
      estilo.remove()
    }
  })

  it('usa texto claro nos controles interativos no modo escuro', () => {
    const estilo = document.createElement('style')
    estilo.textContent = estilosDeWidgets
    document.head.append(estilo)

    try {
      const regrasEscuras = Array.from(estilo.sheet?.cssRules ?? []).filter(
        (regra): regra is CSSStyleRule =>
          regra instanceof CSSStyleRule
          && regra.selectorText.includes(':root[data-color-mode="dark"] .os-pwm'),
      )
      const regraSelecionada = regrasEscuras.find((regra) =>
        regra.selectorText.includes('.os-pwm__alternativas button[aria-pressed="true"]'),
      )
      const regraControle = regrasEscuras.find((regra) =>
        regra.selectorText.includes('.os-pwm__controle'),
      )

      expect(regraSelecionada?.style.color).toBe('var(--color-steel-300)')
      expect(regraControle?.style.color).toBe('var(--color-steel-300)')
    } finally {
      estilo.remove()
    }
  })

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
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
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
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(getItemSpy).not.toHaveBeenCalled()
    expect(setItemSpy).not.toHaveBeenCalled()
    expect(removeItemSpy).not.toHaveBeenCalled()
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

  it('não cria o pulso do LED quando o sistema pede movimento reduzido', async () => {
    preferenciaDeMovimento.reduzido = true
    const user = userEvent.setup()
    render(<PwmLab configuracao={configuracao} />)
    await user.click(screen.getByRole('button', { name: /led parece/i }))

    fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } })

    expect(document.querySelector('[data-pulso]')).toBeNull()
    expect(requestAnimationFrame).not.toHaveBeenCalled()
  })

  it('associa cada pergunta à sua própria seção', () => {
    const { container } = render(
      <>
        <PwmLab configuracao={configuracao} />
        <PwmLab configuracao={configuracao} />
      </>,
    )
    const secoes = Array.from(container.querySelectorAll<HTMLElement>('.os-pwm__previsao'))
    const ids = secoes.map((secao) => secao.getAttribute('aria-labelledby'))

    expect(new Set(ids).size).toBe(2)
    ids.forEach((id, indice) => {
      expect(id).not.toBeNull()
      expect(secoes[indice]?.querySelector('h3')).toHaveAttribute('id', id)
    })
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
