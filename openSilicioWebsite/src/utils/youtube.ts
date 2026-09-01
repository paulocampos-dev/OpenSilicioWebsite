/**
 * Extrai o id de 11 caracteres de um vídeo do YouTube.
 *
 * Espelha `backend/src/utils/youtube.ts`, que é quem decide o que vai para o
 * banco. Esta cópia existe para o formulário mostrar a prévia enquanto o autor
 * digita e para não bloquear um endereço que o servidor aceitaria. As duas
 * precisam reconhecer as mesmas formas: quando uma delas ganhar um padrão novo,
 * a outra ganha junto, senão o formulário recusa o que a API aceita.
 */

const PADRAO_ID = /^[A-Za-z0-9_-]{11}$/

const CAMINHOS = [
  /[?&]v=([A-Za-z0-9_-]{11})/, // youtube.com/watch?v=ID
  /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
  /\/embed\/([A-Za-z0-9_-]{11})/, // youtube.com/embed/ID
  /\/shorts\/([A-Za-z0-9_-]{11})/, // youtube.com/shorts/ID
  /\/live\/([A-Za-z0-9_-]{11})/, // youtube.com/live/ID
]

export function extrairIdDoYouTube(entrada: string | null | undefined): string | null {
  if (typeof entrada !== 'string') return null

  const limpo = entrada.trim()
  if (limpo === '') return null
  if (PADRAO_ID.test(limpo)) return limpo

  for (const padrao of CAMINHOS) {
    const achado = padrao.exec(limpo)
    if (achado?.[1]) return achado[1]
  }

  return null
}
