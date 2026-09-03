/** Uma anotação escrita pelo autor: um trecho da string e a nota que o explica. */
export type Parte = { trecho: string; nota: string }

export type TrechoAnotado = {
  tipo: 'anotado'
  inicio: number
  fim: number
  trecho: string
  nota: string
  /** Posição de `trecho` no array `partes` original (1-based) — é o número
      que aparece tanto sobre o texto quanto na legenda. */
  numero: number
}

export type TrechoSimples = {
  tipo: 'simples'
  inicio: number
  fim: number
  trecho: string
}

export type Resolvido = TrechoAnotado | TrechoSimples

export type ResultadoResolucao =
  | { ok: true; trechos: Resolvido[] }
  | { ok: false; erro: string }

/**
 * Localiza cada `parte.trecho` dentro de `texto` por busca de substring
 * simples, na ordem em que `partes` foi escrito (não a ordem esquerda-
 * -direita da string — o autor pode explicar de trás para frente).
 *
 * Erros: trecho ausente, trecho ambíguo (aparece mais de uma vez — peça
 * mais contexto, ex. `'_1'` em vez de `'1'`), ou trechos que se sobrepõem.
 *
 * Sucesso: os trechos anotados e os intervalos não anotados de `texto`,
 * intercalados na ordem em que aparecem na string (para renderizar a faixa
 * de texto). A legenda é construída pelo chamador a partir do `partes`
 * original — cada entrada bem-sucedida corresponde 1:1 a uma parte.
 */
export function resolverPartes(texto: string, partes: Parte[]): ResultadoResolucao {
  const anotados: TrechoAnotado[] = []

  for (let i = 0; i < partes.length; i++) {
    const { trecho, nota } = partes[i]
    if (!trecho) {
      return { ok: false, erro: `parte ${i + 1} não tem "trecho"` }
    }

    const primeira = texto.indexOf(trecho)
    if (primeira === -1) {
      return { ok: false, erro: `trecho "${trecho}" não aparece em "${texto}"` }
    }

    const ultima = texto.lastIndexOf(trecho)
    if (primeira !== ultima) {
      return {
        ok: false,
        erro: `trecho "${trecho}" aparece mais de uma vez em "${texto}" — inclua mais contexto para desambiguar`,
      }
    }

    const inicio = primeira
    const fim = primeira + trecho.length
    const sobrepoe = anotados.some((a) => inicio < a.fim && fim > a.inicio)
    if (sobrepoe) {
      return { ok: false, erro: `trecho "${trecho}" se sobrepõe a outra parte já anotada` }
    }

    anotados.push({ tipo: 'anotado', inicio, fim, trecho, nota, numero: i + 1 })
  }

  const ordenados = [...anotados].sort((a, b) => a.inicio - b.inicio)

  const trechos: Resolvido[] = []
  let cursor = 0
  for (const a of ordenados) {
    if (a.inicio > cursor) {
      trechos.push({ tipo: 'simples', inicio: cursor, fim: a.inicio, trecho: texto.slice(cursor, a.inicio) })
    }
    trechos.push(a)
    cursor = a.fim
  }
  if (cursor < texto.length) {
    trechos.push({ tipo: 'simples', inicio: cursor, fim: texto.length, trecho: texto.slice(cursor) })
  }

  return { ok: true, trechos }
}
