import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import {
  $createAnatomiaNode,
  AnatomiaNode,
  ANATOMIA_EXEMPLO,
} from '../nodes/AnatomiaNode';

export type InserirAnatomiaPayload = { fonte?: string };

export const INSERT_ANATOMIA_COMMAND: LexicalCommand<InserirAnatomiaPayload> =
  createCommand('INSERT_ANATOMIA_COMMAND');

export default function AnatomiaPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([AnatomiaNode])) {
      throw new Error('AnatomiaPlugin: AnatomiaNode não registrado no editor');
    }

    return editor.registerCommand<InserirAnatomiaPayload>(
      INSERT_ANATOMIA_COMMAND,
      ({ fonte }) => {
        $insertNodes([$createAnatomiaNode(fonte || ANATOMIA_EXEMPLO)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
