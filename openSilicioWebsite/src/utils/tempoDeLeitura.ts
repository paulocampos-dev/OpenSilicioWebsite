/* Estimativa de tempo de leitura a partir de um estado do Lexical.

   200 palavras por minuto é um valor conservador: o padrão citado para prosa
   fica entre 200 e 250, e os tutoriais têm bastante código, que se lê devagar.
   Melhor a estimativa pecar por generosa do que prometer 4 minutos num texto
   que leva 10. */
const PALAVRAS_POR_MINUTO = 200;

interface NoSerializado {
  text?: string;
  children?: NoSerializado[];
}

function contarPalavras(no: NoSerializado): number {
  const proprias =
    typeof no.text === 'string' ? no.text.trim().split(/\s+/).filter(Boolean).length : 0;
  const filhas = (no.children ?? []).reduce((soma, filho) => soma + contarPalavras(filho), 0);
  return proprias + filhas;
}

/**
 * Minutos estimados de leitura, ou null quando o conteúdo está vazio ou não é
 * um estado do Lexical válido. Devolver null em vez de zero deixa a página
 * simplesmente não mostrar o dado, em vez de mostrar "0 min".
 */
export function tempoDeLeitura(conteudo: string | undefined): number | null {
  if (!conteudo) return null;

  let raiz: NoSerializado;
  try {
    const analisado = JSON.parse(conteudo) as { root?: NoSerializado };
    if (!analisado.root) return null;
    raiz = analisado.root;
  } catch {
    return null;
  }

  const palavras = contarPalavras(raiz);
  return palavras === 0 ? null : Math.max(1, Math.round(palavras / PALAVRAS_POR_MINUTO));
}
