import { describe, it, expect, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  type LexicalEditor,
} from 'lexical'
import { $createCodeNode } from '@lexical/code'
import { useEffect } from 'react'
import EquationPlugin from './EquationPlugin'
import { LEXICAL_NODES } from '../nodeSet'
import { LEXICAL_THEME } from '../theme'

/* O transform de equação casa qualquer `$...$` em qualquer TextNode. Os
   tutoriais de shell estão cheios de `$PDK_ROOT/$PDK`, e dois cifrões na mesma
   linha bastavam: o trecho virava uma EquationNode e o comando sumia do post
   sem nenhum aviso. Aconteceu em quatro posts publicados como rascunho.

   Este teste monta o transform de verdade, porque ele só roda dentro de um
   editor: um teste sobre a regex sozinha não veria o node ser substituído. */

afterEach(cleanup)

function Captura({ ao }: { ao: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => ao(editor), [editor, ao])
  return null
}

function montar(preparar: (editor: LexicalEditor) => void) {
  let editor: LexicalEditor | null = null
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'teste',
        nodes: LEXICAL_NODES,
        theme: LEXICAL_THEME,
        onError: (erro) => {
          throw erro
        },
      }}
    >
      <EquationPlugin />
      <Captura
        ao={(e) => {
          editor = e
          preparar(e)
        }}
      />
    </LexicalComposer>,
  )
  return () => editor
}

describe('EquationPlugin', () => {
  it('não toca no texto de um bloco de código com dois cifrões', async () => {
    const comando = 'export LIB=$PDK_ROOT/$PDK/x.lib'
    const pegar = montar((editor) => {
      editor.update(() => {
        const bloco = $createCodeNode('bash')
        bloco.append($createTextNode(comando))
        $getRoot().clear().append(bloco)
      })
    })

    await waitFor(() => {
      const editor = pegar()
      expect(editor).not.toBeNull()
      expect(editor!.getEditorState().read(() => $getRoot().getTextContent())).toBe(comando)
    })
  })

  it('não toca em código embutido na frase', async () => {
    const trecho = 'ls $A/$B'
    const pegar = montar((editor) => {
      editor.update(() => {
        const texto = $createTextNode(trecho)
        texto.toggleFormat('code')
        $getRoot().clear().append($createParagraphNode().append(texto))
      })
    })

    await waitFor(() => {
      const editor = pegar()
      expect(editor).not.toBeNull()
      expect(editor!.getEditorState().read(() => $getRoot().getTextContent())).toBe(trecho)
    })
  })

  /* A prosa não tem a proteção do bloco de código, então quem separa
     matemática de dinheiro e de variável de shell são os delimitadores. */
  const prosaIntacta = [
    'custa $10 e $20 no total',
    'de $10 a $20 por mês',
    'entre $10-$20',
    'use $PDK_ROOT/$PDK para achar o PDK',
    'exporte ${A}/${B} antes',
    'rode $(id -u):$(id -g) na mão',
  ]

  it.each(prosaIntacta)('deixa a prosa em paz: %s', async (frase) => {
    const pegar = montar((editor) => {
      editor.update(() => {
        $getRoot().clear().append($createParagraphNode().append($createTextNode(frase)))
      })
    })

    await waitFor(() => {
      const editor = pegar()
      expect(editor).not.toBeNull()
      expect(editor!.getEditorState().read(() => $getRoot().getTextContent())).toBe(frase)
    })
  })

  it('continua convertendo matemática de verdade', async () => {
    const pegar = montar((editor) => {
      editor.update(() => {
        $getRoot()
          .clear()
          .append($createParagraphNode().append($createTextNode('a energia $E=mc^2$, enfim')))
      })
    })

    await waitFor(() => {
      const editor = pegar()
      expect(editor).not.toBeNull()
      const tipos = editor!.getEditorState().read(() =>
        $getRoot()
          .getChildren()
          .flatMap((filho) => ($isElementNode(filho) ? filho.getChildren() : []))
          .map((filho) => filho.getType()),
      )
      expect(tipos).toContain('equation')
    })
  })
})
