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
 * Dispara quando o leitor alcança o elemento observado, uma vez só.
 *
 * O gatilho é o pé do texto da aula, e vale igual para aula de vídeo: esperar o
 * fim da reprodução exigiria a iframe API do YouTube, um script externo inteiro
 * para um sinal só.
 */
export function useAoChegarAoFim(
  alvo: React.RefObject<HTMLElement | null>,
  aoChegar: () => void,
  ativo = true,
) {
  const jaDisparou = useRef(false)
  const callback = useRef(aoChegar)
  callback.current = aoChegar

  useEffect(() => {
    jaDisparou.current = false
  }, [ativo])

  useEffect(() => {
    const elemento = alvo.current
    if (!elemento || !ativo || typeof IntersectionObserver === 'undefined') return

    const observador = new IntersectionObserver(
      (entradas) => {
        if (entradas.some((e) => e.isIntersecting) && !jaDisparou.current) {
          jaDisparou.current = true
          callback.current()
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    )

    observador.observe(elemento)
    return () => observador.disconnect()
  }, [alvo, ativo])
}
