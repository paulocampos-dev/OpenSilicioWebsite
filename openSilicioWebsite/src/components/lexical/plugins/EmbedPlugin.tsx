import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import { $createEmbedNode, EmbedNode } from '../nodes/EmbedNode';

export type InserirEmbedPayload = { url: string; altura?: number };

export const INSERT_EMBED_COMMAND: LexicalCommand<InserirEmbedPayload> =
  createCommand('INSERT_EMBED_COMMAND');

export default function EmbedPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([EmbedNode])) {
      throw new Error('EmbedPlugin: EmbedNode não registrado no editor');
    }

    return editor.registerCommand<InserirEmbedPayload>(
      INSERT_EMBED_COMMAND,
      ({ url, altura }) => {
        $insertNodes([$createEmbedNode(url, altura)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
