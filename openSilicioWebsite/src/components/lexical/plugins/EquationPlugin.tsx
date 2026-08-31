import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $isCodeNode } from '@lexical/code';
import { $createEquationNode, EquationNode } from '../nodes/EquationNode';
import { $wrapNodeInElement } from '@lexical/utils';
import { $createParagraphNode, $isRootOrShadowRoot, LexicalNode, TextNode } from 'lexical';

/* Delimitadores de equação, com as três restrições que o Pandoc usa para
   separar matemática de dinheiro:

     1. logo depois do `$` de abertura vem um caractere que não é espaço;
     2. logo antes do `$` de fechamento vem um caractere que não é espaço;
     3. o `$` de fechamento não é seguido de caractere de palavra, `(` ou `{`.

   Sem elas, `custa $10 e $20` casava de `$10` até `$2` e o trecho inteiro
   virava equação, apagando o texto. Com elas, o fechamento precisaria colar
   no `e`, o que não acontece.

   A terceira é mais larga que a do Pandoc, que só barra dígito. O conjunto
   maior cobre o que aparece de verdade nestes tutoriais: em `$PDK_ROOT/$PDK`,
   `${A}/${B}` e `$(id -u):$(id -g)` escritos na prosa sem formatação de
   código, o fechamento fica colado num caractere de palavra, num `{` ou num
   `(`, e nada é convertido. O preço é não converter algo como `$x$s`, que
   ninguém escreve, e o botão da barra de ferramentas continua inserindo
   equação na mão. Quando o transform erra, ele apaga texto em silêncio, então
   ele deve errar para o lado de não converter. */
const CONTEUDO = String.raw`(\S|\S[^$]*\S)`;
const BLOCO = new RegExp(String.raw`\$\$${CONTEUDO}\$\$(?![\w({])`);
const EMBUTIDA = new RegExp(String.raw`(^|[^\\])\$${CONTEUDO}\$(?![\w({])`);

export type InsertEquationPayload = {
  equation: string;
  inline?: boolean;
};

export const INSERT_EQUATION_COMMAND: LexicalCommand<InsertEquationPayload> =
  createCommand('INSERT_EQUATION_COMMAND');

export default function EquationPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EquationNode])) {
      throw new Error('EquationPlugin: EquationNode not registered on editor');
    }

    return editor.registerCommand<InsertEquationPayload>(
      INSERT_EQUATION_COMMAND,
      (payload) => {
        const { equation, inline } = payload;
        const equationNode = $createEquationNode(equation, inline);

        $insertNodes([equationNode]);

        if (!inline && $isRootOrShadowRoot(equationNode.getParentOrThrow())) {
          $wrapNodeInElement(equationNode, $createParagraphNode).selectEnd();
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  useEffect(() => {
    // Transform raw text like $E=mc^2$ or $$E=mc^2$$ into EquationNodes
    return editor.registerNodeTransform(TextNode, (textNode: TextNode) => {
      // Nada de equação dentro de código. Um bloco de shell com
      // `$PDK_ROOT/$PDK` tem dois cifrões e casaria aqui: o trecho inteiro
      // virava uma EquationNode e o texto original sumia sem aviso. Vale para
      // o bloco (os CodeHighlightNode são TextNode) e para o código embutido.
      if ($isCodeNode(textNode.getParent()) || textNode.hasFormat('code')) return;

      const textContent = textNode.getTextContent();

      // Match block equations $$...$$ first
      const blockMatch = textContent.match(BLOCO);
      if (blockMatch && blockMatch.index !== undefined) {
        const equation = blockMatch[1] || '';
        let targetNode: TextNode | undefined | null = null;
        if (blockMatch.index === 0) {
          const splitResult = textNode.splitText(blockMatch.index + blockMatch[0].length);
          targetNode = splitResult[0];
        } else {
          const splitResult = textNode.splitText(blockMatch.index, blockMatch.index + blockMatch[0].length);
          targetNode = splitResult[1];
        }

        if (targetNode) {
          const equationNode = $createEquationNode(equation, false);
          targetNode.replace(equationNode);
        }
        return;
      }

      // Match inline equations $...$ next
      const inlineMatch = textContent.match(EMBUTIDA);
      if (inlineMatch && inlineMatch.index !== undefined && inlineMatch[1] !== undefined && inlineMatch[2] !== undefined) {
        // Adjust for the leading char if it's not at the start
        const startIndex = inlineMatch.index + inlineMatch[1].length;
        const equation = inlineMatch[2] || '';
        const fullMatchLength = inlineMatch[0].length - inlineMatch[1].length;

        let targetNode: TextNode | undefined | null = null;
        if (startIndex === 0) {
          const splitResult = textNode.splitText(fullMatchLength);
          targetNode = splitResult[0];
        } else {
          const splitResult = textNode.splitText(startIndex, startIndex + fullMatchLength);
          targetNode = splitResult[1];
        }

        if (targetNode) {
          const equationNode = $createEquationNode(equation, true);
          targetNode.replace(equationNode);
        }
      }
    });
  }, [editor]);

  return null;
}
