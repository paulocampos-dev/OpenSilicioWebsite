import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical'

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $getNodeByKey } from 'lexical'
import * as React from 'react'
import { PwmLab } from '../widgets/PwmLab'
import {
  parsearConfiguracaoPwm,
  type ResultadoConfiguracaoPwm,
} from '../utils/pwmLab'

/** Exemplo válido que o autor recebe ao inserir um laboratório novo. */
export const PWM_LAB_EXEMPLO = `{
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda quando o duty cycle passa de 25% para 75%?',
  alternativas: [
    {
      texto: 'A frequência triplica.',
      correta: false,
      explicacao: 'A frequência permanece no valor configurado.'
    },
    {
      texto: 'O LED parece mais brilhante.',
      correta: true,
      explicacao: 'O sinal passa mais tempo em nível alto.'
    },
    {
      texto: 'A tensão alta passa de 3,3 V.',
      correta: false,
      explicacao: 'A largura do pulso muda, não o nível lógico.'
    }
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3
}`

function PwmLabComponent({
  className,
  format,
  nodeKey,
  fonte,
}: {
  className: Readonly<{ base: string; focus: string }>
  format: ElementFormatType | null
  nodeKey: NodeKey
  fonte: string
}) {
  const [editor] = useLexicalComposerContext()
  const [resultado, setResultado] = React.useState<ResultadoConfiguracaoPwm | null>(null)

  React.useEffect(() => {
    let ativo = true
    setResultado(null)
    void parsearConfiguracaoPwm(fonte).then((novoResultado) => {
      if (ativo) setResultado(novoResultado)
    })
    return () => {
      ativo = false
    }
  }, [fonte])

  const editar = () => {
    const nova = window.prompt('Fonte do laboratório PWM (JSON5):', fonte)
    if (nova === null) return
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isPwmLabNode(node)) node.setFonte(nova)
    })
  }

  const remover = () => {
    editor.update(() => {
      $getNodeByKey(nodeKey)?.remove()
    })
  }

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="os-widget">
        {editor.isEditable() && (
          <div className="os-widget__barra">
            <span>Laboratório PWM</span>
            <span>
              <button type="button" onClick={editar}>editar</button>{' '}
              <button type="button" onClick={remover}>remover</button>
            </span>
          </div>
        )}
        {resultado === null ? (
          <div className="os-widget__corpo">Carregando laboratório...</div>
        ) : !resultado.ok ? (
          <div className="os-widget__erro">
            Não consegui ler a fonte do laboratório: {resultado.erro}
          </div>
        ) : (
          <PwmLab configuracao={resultado.config} />
        )}
      </div>
    </BlockWithAlignableContents>
  )
}

export type SerializedPwmLabNode = Spread<
  { fonte: string },
  SerializedDecoratorBlockNode
>

function converterElemento(domNode: HTMLElement): DOMConversionOutput {
  return {
    node: $createPwmLabNode(domNode.getAttribute('data-os-pwm-lab') ?? ''),
  }
}

export class PwmLabNode extends DecoratorBlockNode {
  __fonte: string

  static getType(): string {
    return 'os-pwm-lab'
  }

  static clone(node: PwmLabNode): PwmLabNode {
    return new PwmLabNode(node.__fonte, node.__format, node.__key)
  }

  static importJSON(serialized: SerializedPwmLabNode): PwmLabNode {
    const node = $createPwmLabNode(serialized.fonte)
    node.setFormat(serialized.format)
    return node
  }

  constructor(fonte: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__fonte = fonte
  }

  exportJSON(): SerializedPwmLabNode {
    return {
      ...super.exportJSON(),
      type: 'os-pwm-lab',
      version: 1,
      fonte: this.__fonte,
    }
  }

  updateDOM(): false {
    return false
  }

  isTopLevel(): true {
    return true
  }

  isInline(): false {
    return false
  }

  getFonte(): string {
    return this.__fonte
  }

  setFonte(fonte: string): void {
    this.getWritable().__fonte = fonte
  }

  getTextContent(): string {
    return this.__fonte
  }

  decorate(_editor: unknown, config: EditorConfig): React.JSX.Element {
    const tema = config.theme.embedBlock || {}
    return (
      <PwmLabComponent
        className={{ base: tema.base || '', focus: tema.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
        fonte={this.__fonte}
      />
    )
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-os-pwm-lab')
          ? { conversion: converterElemento, priority: 2 }
          : null,
    }
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div')
    element.setAttribute('data-os-pwm-lab', this.__fonte)
    return { element }
  }
}

export function $createPwmLabNode(fonte: string): PwmLabNode {
  return new PwmLabNode(fonte)
}

export function $isPwmLabNode(
  node: LexicalNode | null | undefined,
): node is PwmLabNode {
  return node instanceof PwmLabNode
}
