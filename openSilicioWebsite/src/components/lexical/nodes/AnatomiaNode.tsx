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
import { resolverPartes, type Parte } from '../utils/resolverPartes';

/** Fonte de exemplo: a própria quebra do nome sky130 usada no post original.
    Serve de documentação viva do formato quando o autor insere um diagrama
    vazio. */
export const ANATOMIA_EXEMPLO = `{
  texto: 'sky130_fd_sc_hd__inv_1',
  partes: [
    { trecho: '_1', nota: 'força 1, a versão mais fraca' },
    { trecho: 'inv', nota: 'inversor' },
    { trecho: 'hd', nota: 'high density, a biblioteca de alta densidade' },
    { trecho: 'sc', nota: 'standard cell' },
    { trecho: 'fd', nota: 'foundry, quer dizer que a biblioteca é da própria SkyWater' },
    { trecho: 'sky130', nota: 'o processo' },
  ],
}`;

type FonteAnatomia = { texto: string; partes: Parte[] };

type ResultadoCarga =
  | { ok: true; texto: string; partes: Parte[] }
  | { ok: false; erro: string };

/* O JSON5 é leve, mas a política do repo (ver WaveDromNode.tsx) é que
   nenhuma dependência de terceiros entra por import estático num node —
   assim só quem lê um post com este widget baixa o parser. */
async function carregar(fonte: string): Promise<ResultadoCarga> {
  try {
    const JSON5 = await import('json5').then((m) => m.default);
    const origem = JSON5.parse(fonte) as Partial<FonteAnatomia>;
    if (typeof origem.texto !== 'string' || origem.texto.length === 0) {
      return { ok: false, erro: 'fonte precisa de um campo "texto" (string não vazia)' };
    }
    if (!Array.isArray(origem.partes)) {
      return { ok: false, erro: 'fonte precisa de um campo "partes" (lista)' };
    }
    return { ok: true, texto: origem.texto, partes: origem.partes };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, erro: msg };
  }
}

function AnatomiaComponent({
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
  const [carregado, setCarregado] = React.useState<ResultadoCarga | null>(null);

  React.useEffect(() => {
    let vivo = true;
    void carregar(fonte).then((r) => {
      if (vivo) setCarregado(r);
    });
    return () => {
      vivo = false;
    };
  }, [fonte]);

  const editavel = editor.isEditable();

  const editar = () => {
    const nova = window.prompt('Fonte do diagrama anotado (JSON5):', fonte);
    if (nova === null) return;
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isAnatomiaNode(node)) node.setFonte(nova);
    });
  };

  const remover = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  const resultado = carregado && carregado.ok ? resolverPartes(carregado.texto, carregado.partes) : null;

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="os-widget">
        {editavel && (
          <div className="os-widget__barra">
            <span>Diagrama anotado</span>
            <span>
              <button type="button" onClick={editar}>editar</button>{' '}
              <button type="button" onClick={remover}>remover</button>
            </span>
          </div>
        )}
        {carregado === null ? (
          <div className="os-widget__corpo">Carregando diagrama...</div>
        ) : !carregado.ok ? (
          <div className="os-widget__erro">
            Não consegui ler a fonte do diagrama: {carregado.erro}
          </div>
        ) : resultado && !resultado.ok ? (
          <div className="os-widget__erro">{resultado.erro}</div>
        ) : (
          <div className="os-widget__corpo os-anatomia">
            <div className="os-anatomia__string">
              {resultado?.ok &&
                resultado.trechos.map((t, i) =>
                  t.tipo === 'simples' ? (
                    <span key={i} className="os-anatomia__sep">{t.trecho}</span>
                  ) : (
                    <span key={i} className="os-anatomia__tok">
                      {t.trecho}
                      <sup className="os-anatomia__num">{t.numero}</sup>
                    </span>
                  ),
                )}
            </div>
            <div className="os-anatomia__legenda">
              {carregado.partes.map((p, i) => (
                <div key={i} className="os-anatomia__item">
                  <span className="os-anatomia__badge">{i + 1}</span>
                  <span className="os-anatomia__trecho">{p.trecho}</span>
                  <span className="os-anatomia__nota">{p.nota}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedAnatomiaNode = Spread<{ fonte: string }, SerializedDecoratorBlockNode>;

function converterElemento(domNode: HTMLElement): null | DOMConversionOutput {
  const fonte = domNode.getAttribute('data-os-anatomia');
  return fonte ? { node: $createAnatomiaNode(fonte) } : null;
}

export class AnatomiaNode extends DecoratorBlockNode {
  __fonte: string;

  static getType(): string {
    return 'os-anatomia';
  }

  static clone(node: AnatomiaNode): AnatomiaNode {
    return new AnatomiaNode(node.__fonte, node.__format, node.__key);
  }

  static importJSON(serialized: SerializedAnatomiaNode): AnatomiaNode {
    const node = $createAnatomiaNode(serialized.fonte);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedAnatomiaNode {
    return {
      ...super.exportJSON(),
      type: 'os-anatomia',
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
      <AnatomiaComponent
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
        domNode.hasAttribute('data-os-anatomia')
          ? { conversion: converterElemento, priority: 2 }
          : null,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-os-anatomia', this.__fonte);
    return { element };
  }
}

export function $createAnatomiaNode(fonte: string): AnatomiaNode {
  return new AnatomiaNode(fonte);
}

export function $isAnatomiaNode(
  node: LexicalNode | null | undefined,
): node is AnatomiaNode {
  return node instanceof AnatomiaNode;
}
