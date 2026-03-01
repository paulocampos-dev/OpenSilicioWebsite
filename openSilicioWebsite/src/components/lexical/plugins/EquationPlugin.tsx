import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand, LexicalCommand } from 'lexical';
import { useEffect } from 'react';
import { $createEquationNode, EquationNode } from '../nodes/EquationNode';
import { $wrapNodeInElement } from '@lexical/utils';
import { $createParagraphNode, $isRootOrShadowRoot, LexicalNode, TextNode } from 'lexical';

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
      const textContent = textNode.getTextContent();

      // Match block equations $$...$$ first
      const blockMatch = textContent.match(/\$\$([^$]+)\$\$/);
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
      const inlineMatch = textContent.match(/(^|[^\\])\$([^$]+)\$/);
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
