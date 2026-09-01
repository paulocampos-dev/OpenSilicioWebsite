/**
 * Lê os verbetes citados num estado do Lexical.
 *
 * Fica separado do acesso ao banco de propósito: é a parte com regra, e assim
 * dá para testar sem subir Postgres. Quem grava é services/wikiLinkSync.ts.
 */

export interface VerbeteCitado {
  slug: string;
  texto: string;
}

interface NoLexical {
  type?: string;
  url?: string;
  text?: string;
  children?: NoLexical[];
}

const textoDe = (no: NoLexical): string => {
  let acumulado = no.text ?? '';
  for (const filho of no.children ?? []) acumulado += textoDe(filho);
  return acumulado;
};

/**
 * Percorre os estados do Lexical recebidos e devolve os verbetes citados, sem
 * repetição, na ordem em que aparecem. Campo que não for JSON do Lexical é
 * ignorado em silêncio, porque conteúdo antigo pode ser texto puro.
 *
 * Slugs `pending-*` ficam de fora: são marcações de termo que ainda não existe
 * na wiki, então não têm linha em `wiki_entries` para referenciar.
 */
export function extrairVerbetes(campos: Array<string | null | undefined>): VerbeteCitado[] {
  const achados = new Map<string, string>();

  for (const campo of campos) {
    if (typeof campo !== 'string' || !campo.trim().startsWith('{')) continue;

    let raiz: NoLexical;
    try {
      raiz = JSON.parse(campo).root;
    } catch {
      continue;
    }
    if (!raiz) continue;

    const anda = (no: NoLexical): void => {
      if (no.type === 'wikilink') {
        const encontrado = /^\/wiki\/(.+)$/.exec(no.url ?? '');
        const slug = encontrado?.[1];
        if (slug && !slug.startsWith('pending-') && !achados.has(slug)) {
          achados.set(slug, textoDe(no).trim().slice(0, 255) || slug);
        }
      }
      for (const filho of no.children ?? []) anda(filho);
    };
    anda(raiz);
  }

  return [...achados].map(([slug, texto]) => ({ slug, texto }));
}
