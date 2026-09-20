import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $insertNodes,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
} from 'lexical'
import { useEffect } from 'react'
import {
  $createPwmLabNode,
  PwmLabNode,
  PWM_LAB_EXEMPLO,
} from '../nodes/PwmLabNode'

export type InserirPwmLabPayload = { fonte?: string }

export const INSERT_PWM_LAB_COMMAND: LexicalCommand<InserirPwmLabPayload> =
  createCommand('INSERT_PWM_LAB_COMMAND')

export default function PwmLabPlugin(): null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([PwmLabNode])) {
      throw new Error('PwmLabPlugin: PwmLabNode não registrado no editor')
    }

    return editor.registerCommand<InserirPwmLabPayload>(
      INSERT_PWM_LAB_COMMAND,
      ({ fonte }) => {
        $insertNodes([$createPwmLabNode(fonte ?? PWM_LAB_EXEMPLO)])
        return true
      },
      COMMAND_PRIORITY_EDITOR,
    )
  }, [editor])

  return null
}
