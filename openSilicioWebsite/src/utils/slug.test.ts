import { describe, it, expect } from 'vitest'
import { emSlug, emSlugDigitado } from './slug'

describe('emSlug', () => {
  it('transforma um título em endereço', () => {
    expect(emSlug('Do RTL ao GDS')).toBe('do-rtl-ao-gds')
    expect(emSlug('Síntese com Yosys')).toBe('sintese-com-yosys')
    expect(emSlug('O que é um PDK?')).toBe('o-que-e-um-pdk')
  })

  it('não deixa hífen sobrando', () => {
    expect(emSlug('  Ambiente  ')).toBe('ambiente')
    expect(emSlug('a -- b')).toBe('a-b')
    expect(emSlug('---')).toBe('')
  })
})

describe('emSlugDigitado', () => {
  it('deixa o hífen do fim em paz enquanto se digita', () => {
    // Com a normalização completa a cada tecla, "meu-" virava "meu" e o autor
    // não conseguia escrever um slug com hífen à mão.
    expect(emSlugDigitado('meu-')).toBe('meu-')
    expect(emSlugDigitado('do-rtl-ao-')).toBe('do-rtl-ao-')
  })

  it('ainda limpa o que não pode entrar num endereço', () => {
    expect(emSlugDigitado('Meu Curso!')).toBe('meu-curso')
    expect(emSlugDigitado('Ação')).toBe('acao')
    expect(emSlugDigitado('-começo')).toBe('comeco')
  })

  it('o que foi digitado sobrevive à forma final', () => {
    expect(emSlug(emSlugDigitado('do-rtl-ao-gds'))).toBe('do-rtl-ao-gds')
  })
})
