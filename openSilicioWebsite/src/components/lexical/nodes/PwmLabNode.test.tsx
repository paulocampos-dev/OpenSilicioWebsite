import { createHeadlessEditor } from '@lexical/headless'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import { $getRoot, type LexicalEditor } from 'lexical'
import { useEffect, type JSX } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  $createPwmLabNode,
  $isPwmLabNode,
  PwmLabNode,
  PWM_LAB_EXEMPLO,
} from './PwmLabNode'
import {
  parsearConfiguracaoPwm,
  type ConfiguracaoPwm,
  type ResultadoConfiguracaoPwm,
} from '../utils/pwmLab'

vi.mock('../utils/pwmLab', async (importOriginal) => {
  const modulo = await importOriginal<typeof import('../utils/pwmLab')>()
  return { ...modulo, parsearConfiguracaoPwm: vi.fn() }
})

afterEach(() => {
  cleanup()
  vi.resetAllMocks()
})

const configuracaoFinal: ConfiguracaoPwm = {
  titulo: 'Bancada final',
  pergunta: 'Qual resultado chega à bancada?',
  alternativas: [
    { texto: 'A antiga', correta: false, explicacao: 'Não deve chegar.' },
    { texto: 'A nova', correta: true, explicacao: 'É a configuração atual.' },
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3,
}

function adiar<T>() {
  let resolver: (valor: T) => void = () => undefined
  const promise = new Promise<T>((resolve) => {
    resolver = resolve
  })
  return { promise, resolver }
}

function CapturaEditor({ aoCapturar }: { aoCapturar: (editor: LexicalEditor) => void }) {
  const [editor] = useLexicalComposerContext()
  useEffect(() => aoCapturar(editor), [aoCapturar, editor])
  return null
}

function ErrorBoundaryDeTeste({ children }: {
  children: JSX.Element
  onError: (erro: Error) => void
}) {
  return children
}

function montar(fonte: string) {
  let editor: LexicalEditor | null = null
  render(
    <LexicalComposer
      initialConfig={{
        namespace: 'pwm-lab-node-test',
        nodes: [PwmLabNode],
        onError: (erro) => {
          throw erro
        },
        editorState: () => {
          $getRoot().append($createPwmLabNode(fonte))
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={null}
        ErrorBoundary={ErrorBoundaryDeTeste}
      />
      <CapturaEditor aoCapturar={(capturado) => { editor = capturado }} />
    </LexicalComposer>,
  )
  return () => {
    if (editor === null) throw new Error('Editor Lexical não foi capturado')
    return editor
  }
}

describe('PwmLabNode', () => {
  it('serializa e desserializa a fonte sem perda', () => {
    const editor = createHeadlessEditor({ nodes: [PwmLabNode] })
    editor.update(() => {
      const node = $createPwmLabNode(PWM_LAB_EXEMPLO)
      $getRoot().append(node)
      const serializado = node.exportJSON()
      const restaurado = PwmLabNode.importJSON(serializado)
      expect(restaurado.getFonte()).toBe(PWM_LAB_EXEMPLO)
      expect(restaurado.exportJSON()).toMatchObject({ type: 'os-pwm-lab', version: 1 })
    }, { discrete: true })
  })

  it('importa até uma fonte vazia para que o autor possa corrigir', () => {
    const elemento = document.createElement('div')
    elemento.setAttribute('data-os-pwm-lab', '')
    const editor = createHeadlessEditor({ nodes: [PwmLabNode] })
    editor.update(() => {
      const oferta = PwmLabNode.importDOM()?.div?.(elemento)
      expect(oferta).not.toBeNull()
      const saida = oferta?.conversion(elemento)
      const node = Array.isArray(saida?.node) ? saida.node[0] : saida?.node
      expect($isPwmLabNode(node)).toBe(true)
    }, { discrete: true })
  })

  it('descarta o resultado da fonte anterior quando ela muda durante a carga', async () => {
    const primeira = adiar<ResultadoConfiguracaoPwm>()
    const segunda = adiar<ResultadoConfiguracaoPwm>()
    const parsear = vi.mocked(parsearConfiguracaoPwm)
    parsear.mockReturnValueOnce(primeira.promise).mockReturnValueOnce(segunda.promise)
    const pegarEditor = montar('{ titulo: \'primeira\' }')

    await waitFor(() => expect(parsear).toHaveBeenCalledTimes(1))

    act(() => {
      pegarEditor().update(() => {
        const node = $getRoot().getFirstChild()
        if ($isPwmLabNode(node)) node.setFonte('{ titulo: \'segunda\' }')
      })
    })
    await waitFor(() => expect(parsear).toHaveBeenCalledTimes(2))

    await act(async () => {
      segunda.resolver({ ok: true, config: configuracaoFinal })
      await segunda.promise
    })
    await act(async () => {
      primeira.resolver({ ok: false, erro: 'resultado antigo' })
      await primeira.promise
    })

    expect(screen.getByRole('region', { name: 'Bancada final' })).toBeInTheDocument()
    expect(document.querySelector('.os-widget__erro')).toBeNull()
  })

  it('mostra o erro de configuração sem derrubar o editor', async () => {
    vi.mocked(parsearConfiguracaoPwm).mockResolvedValue({
      ok: false,
      erro: 'campo "alternativas" ausente',
    })
    montar('{ alternativas: null }')

    await waitFor(() => {
      const erro = document.querySelector('.os-widget__erro')
      expect(erro).not.toBeNull()
      expect(erro).toHaveTextContent('campo "alternativas" ausente')
    })
  })
})
