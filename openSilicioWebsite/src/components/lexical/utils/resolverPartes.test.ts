import { describe, it, expect } from 'vitest'
import { resolverPartes } from './resolverPartes'

describe('resolverPartes', () => {
  it('resolves the sky130 example into ordered runs, numbered by source order', () => {
    const resultado = resolverPartes('sky130_fd_sc_hd__inv_1', [
      { trecho: '_1', nota: 'força 1, a versão mais fraca' },
      { trecho: 'inv', nota: 'inversor' },
      { trecho: 'hd', nota: 'high density' },
      { trecho: 'sc', nota: 'standard cell' },
      { trecho: 'fd', nota: 'foundry' },
      { trecho: 'sky130', nota: 'o processo' },
    ])

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return

    const anotados = resultado.trechos.filter((t) => t.tipo === 'anotado')
    expect(anotados.map((t) => [t.trecho, t.numero])).toEqual([
      ['sky130', 6],
      ['fd', 5],
      ['sc', 4],
      ['hd', 3],
      ['inv', 2],
      ['_1', 1],
    ])
  })

  it('returns an error when a trecho does not appear in texto', () => {
    const resultado = resolverPartes('abc', [{ trecho: 'zzz', nota: 'x' }])
    expect(resultado).toEqual({ ok: false, erro: 'trecho "zzz" não aparece em "abc"' })
  })

  it('returns an error when a trecho is ambiguous', () => {
    const resultado = resolverPartes('sky130_fd_sc_hd__inv_1', [{ trecho: '1', nota: 'x' }])
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.erro).toContain('aparece mais de uma vez')
  })

  it('returns an error when two partes overlap', () => {
    const resultado = resolverPartes('abcdef', [
      { trecho: 'abcd', nota: 'x' },
      { trecho: 'cd', nota: 'y' },
    ])
    expect(resultado.ok).toBe(false)
    if (resultado.ok) return
    expect(resultado.erro).toContain('se sobrepõe')
  })

  it('returns the whole texto as a single plain run when partes is empty', () => {
    const resultado = resolverPartes('abc', [])
    expect(resultado).toEqual({
      ok: true,
      trechos: [{ tipo: 'simples', inicio: 0, fim: 3, trecho: 'abc' }],
    })
  })
})
