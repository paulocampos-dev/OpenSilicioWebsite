import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical';
import { useEffect } from 'react';
import {
  $createWaveDromNode,
  WaveDromNode,
  WAVEDROM_EXEMPLO,
} from '../nodes/WaveDromNode';

export type InserirWaveDromPayload = { fonte?: string };

export const INSERT_WAVEDROM_COMMAND: LexicalCommand<InserirWaveDromPayload> =
  createCommand('INSERT_WAVEDROM_COMMAND');

export default function WaveDromPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([WaveDromNode])) {
      throw new Error('WaveDromPlugin: WaveDromNode não registrado no editor');
    }

    return editor.registerCommand<InserirWaveDromPayload>(
      INSERT_WAVEDROM_COMMAND,
      ({ fonte }) => {
        $insertNodes([$createWaveDromNode(fonte || WAVEDROM_EXEMPLO)]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);

  return null;
}
