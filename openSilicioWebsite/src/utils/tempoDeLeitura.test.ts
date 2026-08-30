import { describe, it, expect } from 'vitest'
import { tempoDeLeitura } from './tempoDeLeitura'

const estado = (texto: string) =>
  JSON.stringify({ root: { children: [{ children: [{ text: texto }] }] } })

describe('tempoDeLeitura', () => {
  it('conta palavras aninhadas em qualquer profundidade', () => {
    expect(tempoDeLeitura(estado(Array(400).fill('palavra').join(' ')))).toBe(2)
  })

  it('arredonda para pelo menos um minuto', () => {
    expect(tempoDeLeitura(estado('texto bem curto'))).toBe(1)
  })

  it('devolve null para conteúdo vazio, inválido ou sem texto', () => {
    expect(tempoDeLeitura('')).toBeNull()
    expect(tempoDeLeitura(undefined)).toBeNull()
    expect(tempoDeLeitura('nao e json')).toBeNull()
    expect(tempoDeLeitura(JSON.stringify({ semRaiz: true }))).toBeNull()
    expect(tempoDeLeitura(estado('   '))).toBeNull()
  })
})
