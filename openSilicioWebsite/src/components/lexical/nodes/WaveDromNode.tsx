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

/** Fonte de exemplo usada quando o autor insere um diagrama vazio. */
export const WAVEDROM_EXEMPLO = `{
  signal: [
    { name: 'clk',   wave: 'p......' },
    { name: 'rst_n', wave: '01.....' },
    { name: 'cont',  wave: 'x.=====', data: ['0','1','2','3','4'] },
  ]
}`;

// O WaveDrom nomeia o <svg> que gera a partir de um índice numérico. Dois
// diagramas com o mesmo índice na mesma página produziriam ids repetidos, então
// cada instância pega o seu.
let proximoIndice = 0;

type ResultadoRender = { svg: string; erro: null } | { svg: null; erro: string };

/* O WaveDrom mais o JSON5 somam uns 44 kB ao bundle. Como só um punhado de
   posts tem diagrama, a biblioteca entra por import dinâmico: quem lê a wiki ou
   o blog nunca baixa esse peso. Mesmo motivo pelo qual o DigitalJS, se entrar
   um dia, tem de vir por aqui e não por import estático. */
async function renderizar(fonte: string, indice: number): Promise<ResultadoRender> {
  try {
    const [JSON5, wavedrom, skinModule] = await Promise.all([
      import('json5').then((m) => m.default),
      import('wavedrom'),
      import('wavedrom/skins/default.js').then((m) => m.default),
    ]);
    const origem = JSON5.parse(fonte);
    // renderAny percorre e anota a estrutura recebida, então entregamos uma
    // cópia para não guardar estado entre renders.
    const arvore = wavedrom.renderAny(indice, structuredClone(origem), skinModule);
    return { svg: wavedrom.onml.stringify(arvore), erro: null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { svg: null, erro: msg };
  }
}

function WaveDromComponent({
  className,
  format,
  nodeKey,
  fonte,
}: {
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  fonte: string;
}) {
  const [editor] = useLexicalComposerContext();
  const indiceRef = React.useRef<number | null>(null);
  if (indiceRef.current === null) indiceRef.current = proximoIndice++;

  const [resultado, setResultado] = React.useState<ResultadoRender | null>(null);

  React.useEffect(() => {
    let vivo = true;
    void renderizar(fonte, indiceRef.current as number).then((r) => {
      if (vivo) setResultado(r);
    });
    return () => {
      vivo = false;
    };
  }, [fonte]);

  const editavel = editor.isEditable();

  const editar = () => {
    const nova = window.prompt('Fonte do diagrama (formato WaveDrom):', fonte);
    if (nova === null) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isWaveDromNode(node)) node.setFonte(nova);
    });
  };

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
            <span>Diagrama de ondas</span>
            <span>
              <button type="button" onClick={editar}>editar</button>{' '}
              <button type="button" onClick={remover}>remover</button>
            </span>
          </div>
        )}
        {resultado === null ? (
          <div className="os-widget__corpo">Carregando diagrama...</div>
        ) : resultado.erro !== null ? (
          <div className="os-widget__erro">
            Não consegui ler a fonte do diagrama: {resultado.erro}
          </div>
        ) : (
          <div
            className="os-wavedrom"
            // O SVG vem do WaveDrom a partir da fonte que o autor escreveu no
            // admin, que é conteúdo confiável do próprio site.
            dangerouslySetInnerHTML={{ __html: resultado.svg }}
          />
        )}
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedWaveDromNode = Spread<
  { fonte: string },
  SerializedDecoratorBlockNode
>;

function converterElemento(domNode: HTMLElement): null | DOMConversionOutput {
  const fonte = domNode.getAttribute('data-os-wavedrom');
  return fonte ? { node: $createWaveDromNode(fonte) } : null;
}

export class WaveDromNode extends DecoratorBlockNode {
  __fonte: string;

  static getType(): string {
    return 'os-wavedrom';
  }

  static clone(node: WaveDromNode): WaveDromNode {
    return new WaveDromNode(node.__fonte, node.__format, node.__key);
  }

  static importJSON(serialized: SerializedWaveDromNode): WaveDromNode {
    const node = $createWaveDromNode(serialized.fonte);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedWaveDromNode {
    return {
      ...super.exportJSON(),
      type: 'os-wavedrom',
      version: 1,
      fonte: this.__fonte,
    };
  }

  constructor(fonte: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__fonte = fonte;
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

  getFonte(): string {
    return this.__fonte;
  }

  setFonte(fonte: string): void {
    const writable = this.getWritable();
    writable.__fonte = fonte;
  }

  getTextContent(): string {
    return this.__fonte;
  }

  decorate(_editor: unknown, config: EditorConfig): React.JSX.Element {
    const tema = config.theme.embedBlock || {};
    return (
      <WaveDromComponent
        className={{ base: tema.base || '', focus: tema.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
        fonte={this.__fonte}
      />
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-os-wavedrom')
          ? { conversion: converterElemento, priority: 2 }
          : null,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-os-wavedrom', this.__fonte);
    return { element };
  }
}

export function $createWaveDromNode(fonte: string): WaveDromNode {
  return new WaveDromNode(fonte);
}

export function $isWaveDromNode(
  node: LexicalNode | null | undefined,
): node is WaveDromNode {
  return node instanceof WaveDromNode;
}
