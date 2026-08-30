import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { registerCodeHighlighting } from '@lexical/code';

/* O @lexical/code embute o Prism com quinze linguagens: c, clike, cpp, css,
   java, javascript, markdown, markup, objectivec, powershell, python, rust,
   sql, swift e typescript. Nenhuma delas cobre o que os tutoriais realmente
   usam: dos 80 blocos com linguagem da série, 60 são bash, 9 verilog e 4 tcl.
   Só chamar registerCodeHighlighting realçaria 3 blocos.

   O tokenizador resolve a linguagem pelo Prism global (`globalThis.Prism`),
   então importar os componentes aqui registra no mesmo objeto que ele consulta.
   A ordem importa: o import do @lexical/code vem primeiro de propósito, porque
   é ele que carrega o núcleo do Prism que estes componentes estendem. */
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-verilog';
import 'prismjs/components/prism-tcl';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-makefile';

export default function CodeHighlightPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => registerCodeHighlighting(editor), [editor]);

  return null;
}
