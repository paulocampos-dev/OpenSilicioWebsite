import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { useAoChegarAoFim } from './useProgressoDeCurso'

/**
 * O caso que estes testes seguram: a página da aula não desmonta ao navegar de
 * uma aula para a outra, só os parâmetros da rota mudam. Uma versão anterior
 * prendia o observador num efeito, as dependências não mudavam na navegação, e
 * só a primeira aula da sessão era marcada automaticamente.
 */

type Gatilho = (entradas: Array<{ isIntersecting: boolean }>) => void

/** Guarda o callback de cada observador para o teste poder dispará-lo. */
const observadores: Array<{ gatilho: Gatilho; alvos: Element[]; desconectado: boolean }> = []

class ObservadorFalso {
  private registro: { gatilho: Gatilho; alvos: Element[]; desconectado: boolean }

  constructor(gatilho: Gatilho) {
    this.registro = { gatilho, alvos: [], desconectado: false }
    observadores.push(this.registro)
  }

  observe(alvo: Element) {
    this.registro.alvos.push(alvo)
  }

  disconnect() {
    this.registro.desconectado = true
  }

  unobserve() {}
  takeRecords() {
    return []
  }
}

/** O último observador ainda ligado, que é o da aula na tela. */
const observadorAtivo = () => {
  // Sem Array.at: o tsconfig mira es2020, que não tem esse método.
  const ligados = observadores.filter((o) => !o.desconectado)
  return ligados.length > 0 ? ligados[ligados.length - 1] : undefined
}

/**
 * A rolagem da janela, que o gancho consulta para separar o leitor que chegou
 * ao pé da página do sentinela que subiu sozinho enquanto o texto não estava
 * desenhado. `window.scrollY` é só leitura no jsdom, daí o stub.
 */
const rolarPara = (y: number) => vi.stubGlobal('scrollY', y)

function Sentinela({ aoChegar, ativo, chave }: { aoChegar: () => void; ativo?: boolean; chave: string }) {
  const referencia = useAoChegarAoFim(aoChegar, ativo)
  // A chave troca o nó do DOM, que é o que a navegação entre aulas faz.
  return <div key={chave} ref={referencia} />
}

beforeEach(() => {
  observadores.length = 0
  vi.stubGlobal('IntersectionObserver', ObservadorFalso)
  rolarPara(0)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useAoChegarAoFim', () => {
  it('dispara ao alcançar o elemento', () => {
    const aoChegar = vi.fn()
    render(<Sentinela aoChegar={aoChegar} chave="aula-1" />)

    rolarPara(400)
    observadorAtivo()!.gatilho([{ isIntersecting: true }])

    expect(aoChegar).toHaveBeenCalledTimes(1)
  })

  it('não marca o que o leitor não rolou, e continua valendo quando ele rolar', () => {
    // O corpo em Lexical demora alguns quadros para ser desenhado. Até lá o
    // sentinela fica no alto, dentro da tela, e numa janela alta o observador
    // marcava a aula meio segundo depois de abrir, com a página no topo.
    const aoChegar = vi.fn()
    render(<Sentinela aoChegar={aoChegar} chave="aula-1" />)

    observadorAtivo()!.gatilho([{ isIntersecting: true }])
    expect(aoChegar).not.toHaveBeenCalled()

    // E não trancou: quem lê até o fim continua sendo marcado.
    rolarPara(400)
    observadorAtivo()!.gatilho([{ isIntersecting: true }])
    expect(aoChegar).toHaveBeenCalledTimes(1)
  })

  it('dispara uma vez só para o mesmo elemento', () => {
    const aoChegar = vi.fn()
    render(<Sentinela aoChegar={aoChegar} chave="aula-1" />)

    rolarPara(400)
    const observador = observadorAtivo()!
    observador.gatilho([{ isIntersecting: true }])
    observador.gatilho([{ isIntersecting: true }])

    expect(aoChegar).toHaveBeenCalledTimes(1)
  })

  it('volta a disparar na aula seguinte, sem a página desmontar', () => {
    const aoChegar = vi.fn()
    const { rerender } = render(<Sentinela aoChegar={aoChegar} chave="aula-1" />)

    rolarPara(400)
    observadorAtivo()!.gatilho([{ isIntersecting: true }])
    expect(aoChegar).toHaveBeenCalledTimes(1)

    // Mesma página, aula nova: era aqui que a marcação automática morria. A
    // navegação não rebobina a rolagem, então a aula nova nasce onde o leitor
    // parou e é a rolagem daí para baixo que conta.
    rerender(<Sentinela aoChegar={aoChegar} chave="aula-2" />)
    rolarPara(900)
    observadorAtivo()!.gatilho([{ isIntersecting: true }])

    expect(aoChegar).toHaveBeenCalledTimes(2)
  })

  it('larga o observador do elemento que saiu do DOM', () => {
    const { rerender } = render(<Sentinela aoChegar={vi.fn()} chave="aula-1" />)
    const primeiro = observadorAtivo()!

    rerender(<Sentinela aoChegar={vi.fn()} chave="aula-2" />)

    expect(primeiro.desconectado).toBe(true)
  })

  it('não observa nada quando está inativo', () => {
    const aoChegar = vi.fn()
    render(<Sentinela aoChegar={aoChegar} ativo={false} chave="aula-so-video" />)

    expect(observadorAtivo()).toBeUndefined()
    expect(aoChegar).not.toHaveBeenCalled()
  })

  it('ignora a entrada que não está na tela', () => {
    const aoChegar = vi.fn()
    render(<Sentinela aoChegar={aoChegar} chave="aula-1" />)

    observadorAtivo()!.gatilho([{ isIntersecting: false }])

    expect(aoChegar).not.toHaveBeenCalled()
  })
})
