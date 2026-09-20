import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { $getRoot, type LexicalEditor } from 'lexical'
import { useEffect } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { PwmLabNode } from '../nodes/PwmLabNode'
import PwmLabPlugin, { INSERT_PWM_LAB_COMMAND } from './PwmLabPlugin'

afterEach(cleanup)

function CapturaEditor({ aoCapturar }: { aoCapturar: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => aoCapturar(editor), [aoCapturar, editor])
  return null
}

describe('PwmLabPlugin', () => {
  it('insere um nó de laboratório PWM com a fonte de exemplo', async () => {
    let editor: LexicalEditor | null = null
    render(
      <LexicalComposer
        initialConfig={{
          namespace: 'pwm-lab-plugin-test',
          nodes: [PwmLabNode],
          onError: (erro) => {
            throw erro
          },
        }}
      >
        <PwmLabPlugin />
        <CapturaEditor aoCapturar={(capturado) => { editor = capturado }} />
      </LexicalComposer>,
    )

    await waitFor(() => expect(editor).not.toBeNull())
    if (editor === null) throw new Error('Editor Lexical não foi capturado')
    const editorCapturado = editor as LexicalEditor

    act(() => {
      editorCapturado.dispatchCommand(INSERT_PWM_LAB_COMMAND, {})
    })

    await waitFor(() => {
      const tipos = editorCapturado.getEditorState().read(() => $getRoot().getChildren().map((node) => node.getType()))
      expect(tipos).toContain('os-pwm-lab')
    })
  })
})
