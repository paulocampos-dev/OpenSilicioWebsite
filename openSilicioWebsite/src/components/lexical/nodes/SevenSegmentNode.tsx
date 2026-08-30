import type {
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  EditorConfig,
  ElementFormatType,
  LexicalNode,
  NodeKey,
  Spread,
} from 'lexical';

import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents';
import {
  DecoratorBlockNode,
  SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode';
import * as React from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey } from 'lexical';

/* Mesma tabela do tutorial "Seu primeiro Verilog": bit 0 é o segmento a e bit 6
   é o g. O widget existe para que o leitor veja o `case` do decodificador
   funcionando sem precisar rodar nada. */
const TABELA = [
  0x3f, 0x06, 0x5b, 0x4f, 0x66, 0x6d, 0x7d, 0x07,
  0x7f, 0x6f, 0x77, 0x7c, 0x39, 0x5e, 0x79, 0x71,
] as const;

const HEX = '0123456789ABCDEF';
const MEIA = 7;

function horizontal(cy: number, x1: number, x2: number): string {
  return [
    [x1, cy], [x1 + MEIA, cy - MEIA], [x2 - MEIA, cy - MEIA],
    [x2, cy], [x2 - MEIA, cy + MEIA], [x1 + MEIA, cy + MEIA],
  ].map((p) => p.join(',')).join(' ');
}

function vertical(cx: number, y1: number, y2: number): string {
  return [
    [cx, y1], [cx + MEIA, y1 + MEIA], [cx + MEIA, y2 - MEIA],
    [cx, y2], [cx - MEIA, y2 - MEIA], [cx - MEIA, y1 + MEIA],
  ].map((p) => p.join(',')).join(' ');
}

// Ordem do array = ordem dos bits, de a (bit 0) a g (bit 6).
const SEGMENTOS: ReadonlyArray<{ nome: string; pontos: string }> = [
  { nome: 'a', pontos: horizontal(15, 20, 80) },
  { nome: 'b', pontos: vertical(80, 15, 90) },
  { nome: 'c', pontos: vertical(80, 90, 165) },
  { nome: 'd', pontos: horizontal(165, 20, 80) },
  { nome: 'e', pontos: vertical(20, 90, 165) },
  { nome: 'f', pontos: vertical(20, 15, 90) },
  { nome: 'g', pontos: horizontal(90, 20, 80) },
];

function Display({ padrao, digito }: { padrao: number; digito: string }) {
  return (
    <svg viewBox="0 0 100 180" width="88" height="158" role="img"
      aria-label={`Display de 7 segmentos mostrando ${digito}`}>
      {SEGMENTOS.map((seg, i) => {
        const aceso = (padrao >> i) & 1;
        return (
          <polygon
            key={seg.nome}
            points={seg.pontos}
            fill={aceso ? 'var(--color-accent)' : 'var(--color-line)'}
          />
        );
      })}
    </svg>
  );
}

function SevenSegmentComponent({
  className,
  format,
  nodeKey,
  valorInicial,
}: {
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  valorInicial: number;
}) {
  const [editor] = useLexicalComposerContext();
  const [valor, setValor] = React.useState(valorInicial & 0xf);
  const editavel = editor.isEditable();

  const padrao = TABELA[valor] ?? 0;
  const literal = padrao.toString(2).padStart(7, '0');
  const acesos = SEGMENTOS.filter((_, i) => (padrao >> i) & 1).map((s) => s.nome);

  const alternarBit = (bit: number) => setValor((v) => v ^ (1 << bit));

  const remover = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="os-widget">
        {editavel && (
          <div className="os-widget__barra">
            <span>Decodificador de 7 segmentos</span>
            <button type="button" onClick={remover}>remover</button>
          </div>
        )}
        <div className="os-widget__corpo">
          <div className="os-7seg__painel">
            <div className="os-7seg__bits">
              {[3, 2, 1, 0].map((bit) => {
                const ligado = ((valor >> bit) & 1) === 1;
                return (
                  <span key={bit} className="os-7seg__bit">
                    <button
                      type="button"
                      className="os-7seg__chave"
                      aria-pressed={ligado}
                      aria-label={`bit ${bit}`}
                      onClick={() => alternarBit(bit)}
                    >
                      {ligado ? 1 : 0}
                    </button>
                    contador[{bit}]
                  </span>
                );
              })}
            </div>

            <Display padrao={padrao} digito={HEX[valor] ?? "0"} />

            <div className="os-7seg__saida">
              contador = <b>4&apos;h{HEX[valor]}</b>
              <br />
              segmentos = <b>7&apos;b{literal}</b>
              <br />
              acesos: <b>{acesos.length > 0 ? acesos.join(', ') : 'nenhum'}</b>
            </div>
          </div>
        </div>
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedSevenSegmentNode = Spread<
  { valorInicial: number },
  SerializedDecoratorBlockNode
>;

function converterElemento(domNode: HTMLElement): null | DOMConversionOutput {
  if (!domNode.hasAttribute('data-os-7seg')) return null;
  const v = Number.parseInt(domNode.getAttribute('data-os-7seg') || '0', 10);
  return { node: $createSevenSegmentNode(Number.isFinite(v) ? v : 0) };
}

export class SevenSegmentNode extends DecoratorBlockNode {
  __valorInicial: number;

  static getType(): string {
    return 'os-7seg';
  }

  static clone(node: SevenSegmentNode): SevenSegmentNode {
    return new SevenSegmentNode(node.__valorInicial, node.__format, node.__key);
  }

  static importJSON(s: SerializedSevenSegmentNode): SevenSegmentNode {
    const node = $createSevenSegmentNode(s.valorInicial);
    node.setFormat(s.format);
    return node;
  }

  exportJSON(): SerializedSevenSegmentNode {
    return {
      ...super.exportJSON(),
      type: 'os-7seg',
      version: 1,
      valorInicial: this.__valorInicial,
    };
  }

  constructor(valorInicial = 0, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__valorInicial = valorInicial & 0xf;
  }

  updateDOM(): false {
    return false;
  }

  isTopLevel(): true {
    return true;
  }

  isInline(): false {
    return false;
  }

  getTextContent(): string {
    return 'Decodificador de 7 segmentos (widget interativo)';
  }

  decorate(_editor: unknown, config: EditorConfig): React.JSX.Element {
    const tema = config.theme.embedBlock || {};
    return (
      <SevenSegmentComponent
        className={{ base: tema.base || '', focus: tema.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
        valorInicial={this.__valorInicial}
      />
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-os-7seg')
          ? { conversion: converterElemento, priority: 2 }
          : null,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-os-7seg', String(this.__valorInicial));
    return { element };
  }
}

export function $createSevenSegmentNode(valorInicial = 0): SevenSegmentNode {
  return new SevenSegmentNode(valorInicial);
}

export function $isSevenSegmentNode(
  node: LexicalNode | null | undefined,
): node is SevenSegmentNode {
  return node instanceof SevenSegmentNode;
}
