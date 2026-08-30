/* Ponto único de entrada dos widgets interativos dos tutoriais.

   Os nodes ficam em nodeSet.ts, junto com todos os outros, porque o leitor
   também precisa deles: um node ausente lá faz o post inteiro falhar ao
   renderizar, não só o widget. Aqui ficam só os plugins de inserção, que são
   exclusivos do editor.

   Para acrescentar um widget novo: registre o node em nodeSet.ts, monte o
   plugin aqui e adicione o botão no ToolbarPlugin. */

import WaveDromPlugin from './plugins/WaveDromPlugin';
import EmbedPlugin from './plugins/EmbedPlugin';
import SevenSegmentPlugin from './plugins/SevenSegmentPlugin';

/** Plugins de inserção. Só o editor precisa deles; o leitor não insere nada. */
export function OsWidgetPlugins() {
  return (
    <>
      <WaveDromPlugin />
      <EmbedPlugin />
      <SevenSegmentPlugin />
    </>
  );
}
