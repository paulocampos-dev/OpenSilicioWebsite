import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ToolbarPlugin from './ToolbarPlugin'

describe('ToolbarPlugin no celular', () => {
  it('contém o excesso horizontal e mantém alvos de toque confortáveis', () => {
    render(
      <LexicalComposer
        initialConfig={{
          namespace: 'toolbar-mobile-test',
          onError: (error) => {
            throw error
          },
          theme: {},
        }}
      >
        <ToolbarPlugin />
      </LexicalComposer>,
    )

    expect(screen.getByRole('toolbar')).toHaveStyle({ overflowX: 'auto' })
    expect(screen.getByRole('button', { name: 'Negrito' })).toHaveStyle({ minWidth: '44px' })
  })
})
