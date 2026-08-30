import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import { $createSevenSegmentNode, SevenSegmentNode } from '../nodes/SevenSegmentNode';

export type InserirSevenSegmentPayload = { valorInicial?: number };

export const INSERT_SEVEN_SEGMENT_COMMAND: LexicalCommand<InserirSevenSegmentPayload> =
  createCommand('INSERT_SEVEN_SEGMENT_COMMAND');

export default function SevenSegmentPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([SevenSegmentNode])) {
      throw new Error('SevenSegmentPlugin: SevenSegmentNode não registrado no editor');
    }

    return editor.registerCommand<InserirSevenSegmentPayload>(
      INSERT_SEVEN_SEGMENT_COMMAND,
      ({ valorInicial }) => {
        $insertNodes([$createSevenSegmentNode(valorInicial ?? 0)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
