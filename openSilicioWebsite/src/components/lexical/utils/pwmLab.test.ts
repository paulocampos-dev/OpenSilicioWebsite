import { describe, expect, it } from 'vitest'
import {
  calcularPwm,
  criarCaminhoPwm,
  parsearConfiguracaoPwm,
} from './pwmLab'

const fonteValida = `{
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda?',
  alternativas: [
    { texto: 'Frequência', correta: false, explicacao: 'Permanece igual.' },
    { texto: 'Brilho', correta: true, explicacao: 'Aumenta.' },
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3,
}`

describe('calcularPwm', () => {
  it.each([
    [25, 10, 2.5, 0.825],
    [50, 10, 5, 1.65],
    [75, 10, 7.5, 2.475],
  ])('calcula %s%%', (duty, periodoMs, tempoAltoMs, tensaoMediaVolts) => {
    expect(calcularPwm(duty, 100, 3.3)).toEqual({
      periodoMs,
      tempoAltoMs,
      tensaoMediaVolts,
    })
  })

  it('mantém medidas finitas nos limites válidos', () => {
    const medidas = calcularPwm(95, 100_000, 24)
    expect(medidas).toEqual({ periodoMs: 0.01, tempoAltoMs: 0.0095, tensaoMediaVolts: 22.8 })
    expect(Object.values(medidas).every(Number.isFinite)).toBe(true)
  })
})

describe('criarCaminhoPwm', () => {
  it('gera quatro pulsos com largura proporcional ao duty cycle', () => {
    expect(criarCaminhoPwm(25, 4)).toBe(
      'M0 90V10H25V90H100V10H125V90H200V10H225V90H300V10H325V90H400',
    )
  })

  it.each([5, 95])('gera caminho nos limites, %s%%', (duty) => {
    expect(criarCaminhoPwm(duty, 4)).toMatch(/^M0 90V10/)
  })
})

describe('parsearConfiguracaoPwm', () => {
  it('aceita JSON5 com comentário e vírgula final', async () => {
    const resultado = await parsearConfiguracaoPwm(`// comentário\n${fonteValida}`)
    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.config.alternativas).toHaveLength(2)
    expect(resultado.config.alternativas.filter((a) => a.correta)).toHaveLength(1)
  })

  it('rejeita uma única alternativa, mesmo quando há uma correta', async () => {
    const fonte = fonteValida
      .replace('correta: false', 'correta: true')
      .replace("    { texto: 'Brilho', correta: true, explicacao: 'Aumenta.' },\n", '')

    const resultado = await parsearConfiguracaoPwm(fonte)

    expect(resultado).toMatchObject({ ok: false, erro: expect.stringContaining('entre 2 e 4 alternativas') })
  })

  it('rejeita mais de quatro alternativas, mesmo quando há uma correta', async () => {
    const fonte = fonteValida.replace(
      '  ],',
      `    { texto: 'Tensão', correta: false, explicacao: 'Permanece igual.' },
    { texto: 'Corrente', correta: false, explicacao: 'Permanece igual.' },
    { texto: 'Potência', correta: false, explicacao: 'Permanece igual.' },
  ],`,
    )

    const resultado = await parsearConfiguracaoPwm(fonte)

    expect(resultado).toMatchObject({ ok: false, erro: expect.stringContaining('entre 2 e 4 alternativas') })
  })

  it('rejeita dutyInicial fracionário', async () => {
    const resultado = await parsearConfiguracaoPwm(
      fonteValida.replace('dutyInicial: 25', 'dutyInicial: 25.5'),
    )

    expect(resultado).toMatchObject({ ok: false, erro: expect.stringContaining('dutyInicial') })
  })

  it('aceita frequenciaHz positiva fracionária', async () => {
    const resultado = await parsearConfiguracaoPwm(
      fonteValida.replace('frequenciaHz: 100', 'frequenciaHz: 0.5'),
    )

    expect(resultado).toMatchObject({ ok: true, config: { frequenciaHz: 0.5 } })
  })

  it('rejeita tensaoVolts igual a zero', async () => {
    const resultado = await parsearConfiguracaoPwm(
      fonteValida.replace('tensaoVolts: 3.3', 'tensaoVolts: 0'),
    )

    expect(resultado).toMatchObject({ ok: false, erro: expect.stringContaining('tensaoVolts') })
  })

  it.each([
    ['titulo', fonteValida.replace("titulo: 'Brilho por PWM'", "titulo: '  '")],
    ['pergunta', fonteValida.replace("pergunta: 'O que muda?'", "pergunta: ''")],
    ['alternativas[0].texto', fonteValida.replace("texto: 'Frequência'", "texto: ''")],
    ['alternativas[0].explicacao', fonteValida.replace("explicacao: 'Permanece igual.'", "explicacao: '  '")],
  ])('rejeita %s vazio', async (campo, fonte) => {
    const resultado = await parsearConfiguracaoPwm(fonte)

    expect(resultado).toMatchObject({ ok: false, erro: expect.stringContaining(campo) })
  })

  it.each([
    ['{', 'JSON5 inválido'],
    ['{}', 'campo "titulo"'],
    [fonteValida.replace('alternativas: [', 'alternativas: null, ignoradas: ['), 'campo "alternativas"'],
    [fonteValida.replace('correta: false', 'correta: true'), 'exatamente uma alternativa correta'],
    [fonteValida.replace('dutyInicial: 25', 'dutyInicial: 4'), 'dutyInicial'],
    [fonteValida.replace('frequenciaHz: 100', 'frequenciaHz: 0'), 'frequenciaHz'],
    [fonteValida.replace('tensaoVolts: 3.3', 'tensaoVolts: 25'), 'tensaoVolts'],
  ])('rejeita forma inválida com mensagem útil', async (fonte, mensagem) => {
    const resultado = await parsearConfiguracaoPwm(fonte)
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.erro).toContain(mensagem)
  })
})
