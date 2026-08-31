/* Tema compartilhado entre o editor e o leitor.

   Precisa ser o mesmo nos dois pelo mesmo motivo de nodeSet.ts: o realce de
   sintaxe vira CodeHighlightNode dentro do estado salvo, e cada um desses nodes
   guarda só o tipo do token (keyword, string, comment...). Quem transforma isso
   em cor é o mapa abaixo. Se o leitor tiver outro tema, o post sai sem cor. */

export const LEXICAL_THEME = {
  // Classe no <code> do bloco, usada pelo rótulo de idioma e pelo
  // posicionamento do botão de copiar em patterns/code.css.
  code: 'os-code',
  codeHighlight: {
    atrule: 'os-tok-keyword',
    attr: 'os-tok-attr',
    boolean: 'os-tok-const',
    builtin: 'os-tok-builtin',
    cdata: 'os-tok-comment',
    char: 'os-tok-string',
    class: 'os-tok-class',
    'class-name': 'os-tok-class',
    comment: 'os-tok-comment',
    constant: 'os-tok-const',
    deleted: 'os-tok-deleted',
    doctype: 'os-tok-comment',
    entity: 'os-tok-operator',
    function: 'os-tok-function',
    important: 'os-tok-keyword',
    inserted: 'os-tok-inserted',
    keyword: 'os-tok-keyword',
    namespace: 'os-tok-attr',
    number: 'os-tok-number',
    operator: 'os-tok-operator',
    prolog: 'os-tok-comment',
    property: 'os-tok-attr',
    punctuation: 'os-tok-punct',
    regex: 'os-tok-string',
    selector: 'os-tok-class',
    string: 'os-tok-string',
    symbol: 'os-tok-const',
    tag: 'os-tok-keyword',
    url: 'os-tok-operator',
    variable: 'os-tok-variable',
  },
} as const;
