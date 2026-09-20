import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CHAVE_DE_ARMAZENAMENTO,
  contarConcluidas,
  definirEstado,
  estaConcluida,
  lerProgresso,
  marcarAutomaticamente,
  proximaAula,
  quizConcluido,
  melhorNota,
  tentativasDoQuiz,
  registrarTentativa,
  registrarVisita,
  temProgressoGravado,
  zerarCurso,
  type AulaPublicada,
  type Progresso,
  type UltimaAtividade,
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
    setProgresso((anterior) =>
      registrarVisita(anterior, curso, { tipo: 'aula', slug: aula }),
    )
  }, [])

  const visitarAtividade = useCallback((curso: string, atividade: UltimaAtividade) => {
    setProgresso((anterior) => registrarVisita(anterior, curso, atividade))
  }, [])

  const registrarResultado = useCallback((curso: string, quiz: string, nota: number) => {
    setProgresso((anterior) => registrarTentativa(anterior, curso, quiz, nota))
  }, [])

  const zerar = useCallback((curso: string) => {
    setProgresso((anterior) => zerarCurso(anterior, curso))
  }, [])

  const concluida = useCallback(
    (curso: string, aula: string) => estaConcluida(progresso, curso, aula),
    [progresso],
  )

  const temProgresso = useCallback(
    (curso: string) => temProgressoGravado(progresso, curso),
    [progresso],
  )

  const concluidas = useCallback(
    (curso: string, publicadas: readonly AulaPublicada[]) =>
      contarConcluidas(progresso, curso, publicadas),
    [progresso],
  )

  const retomarEm = useCallback(
    (curso: string, publicadas: readonly AulaPublicada[]) =>
      proximaAula(progresso, curso, publicadas),
    [progresso],
  )

  const notaDoQuiz = useCallback(
    (curso: string, quiz: string) => melhorNota(progresso, curso, quiz),
    [progresso],
  )

  const tentativas = useCallback(
    (curso: string, quiz: string) => tentativasDoQuiz(progresso, curso, quiz),
    [progresso],
  )

  const quizEstaConcluido = useCallback(
    (curso: string, quiz: string, notaMinima: number) =>
      quizConcluido(progresso, curso, quiz, notaMinima),
    [progresso],
  )

  return {
    progresso,
    marcarAutomatico,
    alternar,
    visitar,
    visitarAtividade,
    registrarResultado,
    zerar,
    concluida,
    concluidas,
    temProgresso,
    retomarEm,
    notaDoQuiz,
    tentativasDoQuiz: tentativas,
    quizEstaConcluido,
  }
}

/**
 * Dispara uma vez quando o leitor rola até o elemento observado. Devolve a ref
 * que deve ser presa nesse elemento.
 *
 * É uma ref de callback, e não um objeto de ref com um efeito, porque a página
 * da aula não desmonta ao navegar de uma aula para a outra: só os parâmetros da
 * rota mudam. Com um efeito, as dependências não mudariam, o observador
 * continuaria preso ao sentinela da aula anterior (que o esqueleto de
 * carregamento já tirou do DOM) e só a primeira aula da sessão seria marcada. A
 * ref de callback é chamada exatamente quando o nó entra e sai do DOM, então
 * cada aula recebe o seu observador e o seu "ainda não disparei".
 *
 * Exigir a rolagem não é firula: o corpo em Lexical leva alguns quadros para
 * ser desenhado, e nesse meio-tempo o sentinela fica logo abaixo do título,
 * dentro da tela. Numa janela alta o observador via isso e marcava a aula como
 * concluída meio segundo depois de abrir, sem ninguém ler nada. A conta que
 * fica: aula curta demais para rolar não se marca sozinha, e o leitor usa o
 * botão — a mesma troca que a aula só de vídeo já fazia.
 */
export function useAoChegarAoFim(aoChegar: () => void, ativo = true) {
  const callback = useRef(aoChegar)
  callback.current = aoChegar

  const observador = useRef<IntersectionObserver | null>(null)
  const jaDisparou = useRef(false)
  const rolagemAoAbrir = useRef(0)

  const referencia = useCallback(
    (elemento: HTMLElement | null) => {
      observador.current?.disconnect()
      observador.current = null

      if (!elemento || !ativo || typeof IntersectionObserver === 'undefined') return

      // Nó novo é aula nova: o disparo recomeça do zero.
      jaDisparou.current = false
      // Onde a página estava quando esta aula entrou. Numa carga nova é o topo;
      // vindo de outra aula é onde o leitor parou, porque a navegação entre
      // aulas não rebobina a rolagem.
      rolagemAoAbrir.current = window.scrollY

      const observando = new IntersectionObserver(
        (entradas) => {
          if (jaDisparou.current || !entradas.some((e) => e.isIntersecting)) return

          // Ninguém rolou desde que a aula abriu: quem cruzou a tela foi o
          // sentinela, empurrado para baixo pelo texto que acabou de ser
          // desenhado, e não o leitor chegando ao pé da página. Sai sem
          // trancar, para a chegada de verdade ainda valer.
          if (window.scrollY <= rolagemAoAbrir.current) return

          jaDisparou.current = true
          callback.current()
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
