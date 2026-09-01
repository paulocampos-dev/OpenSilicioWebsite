/**
 * Extrai o id de 11 caracteres de um vídeo do YouTube.
 *
 * O autor cola o que o navegador deu: a URL da barra de endereços, o link do
 * botão Compartilhar, às vezes o id sozinho. Guardar o id, e não a URL, é o que
 * permite montar o embed em youtube-nocookie.com, o mesmo host que o YouTubeNode
 * do Lexical já usa, então o consentimento de cookies não muda.
 *
 * Existe uma cópia disto em `openSilicioWebsite/src/utils/youtube.ts`, usada na
 * pré-visualização do formulário. Este aqui é quem decide o que vai para o
 * banco, mas as duas precisam reconhecer as mesmas formas: se o formulário
 * reconhecer menos, ele recusa um endereço que a API gravaria sem reclamar.
 * Os dois testes cobrem a mesma lista de casos.
 */

const PADRAO_ID = /^[A-Za-z0-9_-]{11}$/;

const CAMINHOS = [
  /[?&]v=([A-Za-z0-9_-]{11})/, // youtube.com/watch?v=ID
  /youtu\.be\/([A-Za-z0-9_-]{11})/, // youtu.be/ID
  /\/embed\/([A-Za-z0-9_-]{11})/, // youtube.com/embed/ID
  /\/shorts\/([A-Za-z0-9_-]{11})/, // youtube.com/shorts/ID
  /\/live\/([A-Za-z0-9_-]{11})/, // youtube.com/live/ID
];

export function extrairIdDoYouTube(entrada: string | null | undefined): string | null {
  if (typeof entrada !== 'string') return null;

  const limpo = entrada.trim();
  if (limpo === '') return null;
  if (PADRAO_ID.test(limpo)) return limpo;

  for (const padrao of CAMINHOS) {
    const achado = padrao.exec(limpo);
    if (achado?.[1]) return achado[1];
  }

  return null;
}
