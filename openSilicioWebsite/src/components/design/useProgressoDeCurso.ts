import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CHAVE_DE_ARMAZENAMENTO,
  contarConcluidas,
  definirEstado,
  estaConcluida,
  lerProgresso,
  marcarAutomaticamente,
  proximaAula,
  registrarVisita,
  type Progresso,
} from '../../utils/progressoDeCurso'

/**
 * O progresso do leitor, ligado ao localStorage.
 *
 * A regra toda mora em utils/progressoDeCurso.ts, testada sem DOM. Aqui só
 * ficam o estado do React e as duas idas ao armazenamento, cada uma dentro de
 * um try/catch: em aba anônima o localStorage pode lançar, e nada disso vale
 * derrubar a página de um curso.
 */
export function useProgressoDeCurso() {
  const [progresso, setProgresso] = useState<Progresso>(() => {
    try {
      return lerProgresso(localStorage.getItem(CHAVE_DE_ARMAZENAMENTO))
    } catch {
      return {}
    }
  })

  // A primeira renderização acabou de ler o armazenamento; regravar o mesmo
  // valor por cima não serve para nada.
  const primeiraVez = useRef(true)

  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    try {
      localStorage.setItem(CHAVE_DE_ARMAZENAMENTO, JSON.stringify(progresso))
    } catch {
      // Sem persistência, o progresso ainda vale para esta sessão.
    }
  }, [progresso])

  const marcarAutomatico = useCallback((curso: string, aula: string) => {
    setProgresso((anterior) => marcarAutomaticamente(anterior, curso, aula))
  }, [])

  const alternar = useCallback((curso: string, aula: string, concluida: boolean) => {
    setProgresso((anterior) =>
      definirEstado(anterior, curso, aula, concluida ? 'concluida' : 'nao-concluida'),
    )
  }, [])

  const visitar = useCallback((curso: string, aula: string) => {
    setProgresso((anterior) => registrarVisita(anterior, curso, aula))
  }, [])

  const concluida = useCallback(
    (curso: string, aula: string) => estaConcluida(progresso, curso, aula),
    [progresso],
  )

  const concluidas = useCallback(
    (curso: string, publicadas: string[]) => contarConcluidas(progresso, curso, publicadas),
    [progresso],
  )

  const retomarEm = useCallback(
    (curso: string, publicadas: string[]) => proximaAula(progresso, curso, publicadas),
    [progresso],
  )

  return { progresso, marcarAutomatico, alternar, visitar, concluida, concluidas, retomarEm }
}

/**
 * Dispara uma vez quando o leitor alcança o elemento observado. Devolve a ref
 * que deve ser presa nesse elemento.
 *
 * É uma ref de callback, e não um objeto de ref com um efeito, porque a página
 * da aula não desmonta ao navegar de uma aula para a outra: só os parâmetros da
 * rota mudam. Com um efeito, as dependências não mudariam, o observador
 * continuaria preso ao sentinela da aula anterior (que o esqueleto de
 * carregamento já tirou do DOM) e só a primeira aula da sessão seria marcada. A
 * ref de callback é chamada exatamente quando o nó entra e sai do DOM, então
 * cada aula recebe o seu observador e o seu "ainda não disparei".
 */
export function useAoChegarAoFim(aoChegar: () => void, ativo = true) {
  const callback = useRef(aoChegar)
  callback.current = aoChegar

  const observador = useRef<IntersectionObserver | null>(null)
  const jaDisparou = useRef(false)

  const referencia = useCallback(
    (elemento: HTMLElement | null) => {
      observador.current?.disconnect()
      observador.current = null

      if (!elemento || !ativo || typeof IntersectionObserver === 'undefined') return

      // Nó novo é aula nova: o disparo recomeça do zero.
      jaDisparou.current = false

      const observando = new IntersectionObserver(
        (entradas) => {
          if (entradas.some((e) => e.isIntersecting) && !jaDisparou.current) {
            jaDisparou.current = true
            callback.current()
          }
        },
        { rootMargin: '0px 0px -10% 0px' },
      )

      observando.observe(elemento)
      observador.current = observando
    },
    [ativo],
  )

  useEffect(() => () => observador.current?.disconnect(), [])

  return referencia
}
