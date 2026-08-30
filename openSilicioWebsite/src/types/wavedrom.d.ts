/* O WaveDrom não publica tipos. Declaramos apenas a superfície que usamos:
   renderAny transforma a fonte do diagrama numa árvore ONML, e onml.stringify
   converte essa árvore em SVG. */
declare module 'wavedrom' {
  export type ArvoreOnml = unknown;
  export function renderAny(indice: number, origem: unknown, skin: unknown): ArvoreOnml;
  export const onml: { stringify(arvore: ArvoreOnml): string };
}

declare module 'wavedrom/skins/default.js' {
  const skin: unknown;
  export default skin;
}
