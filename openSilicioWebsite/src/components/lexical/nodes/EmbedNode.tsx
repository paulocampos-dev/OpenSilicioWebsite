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

/* Este node coloca uma página de terceiro dentro do site, então a lista de
   hosts é fechada por princípio: uma incorporação arbitrária seria um vetor de
   injeção para qualquer pessoa com acesso ao admin. Para permitir uma
   ferramenta nova, acrescente o host aqui, conscientemente. */
const HOSTS_PERMITIDOS: ReadonlyArray<{ host: string; rotulo: string }> = [
  { host: 'wokwi.com', rotulo: 'Wokwi' },
  { host: 'app.siliwiz.com', rotulo: 'SiliWiz' },
  { host: 'siliwiz.com', rotulo: 'SiliWiz' },
  { host: 'tinytapeout.com', rotulo: 'Tiny Tapeout' },
  { host: 'digitaljs.tilk.eu', rotulo: 'DigitalJS' },
];

export type EmbedVerificado = { ok: true; url: string; rotulo: string } | { ok: false; motivo: string };

/** Aceita a URL apenas se for https e de um host da lista. */
export function verificarUrlEmbed(bruta: string): EmbedVerificado {
  let url: URL;
  try {
    url = new URL(bruta.trim());
  } catch {
    return { ok: false, motivo: 'URL inválida.' };
  }
  if (url.protocol !== 'https:') {
    return { ok: false, motivo: 'Só aceitamos endereços https.' };
  }
  const host = url.hostname.replace(/^www\./, '');
  const permitido = HOSTS_PERMITIDOS.find(
    (p) => host === p.host || host.endsWith(`.${p.host}`),
  );
  if (!permitido) {
    const lista = HOSTS_PERMITIDOS.map((p) => p.host).join(', ');
    return { ok: false, motivo: `Host não permitido. Aceitos: ${lista}.` };
  }
  return { ok: true, url: url.toString(), rotulo: permitido.rotulo };
}

function EmbedComponent({
  className,
  format,
  nodeKey,
  url,
  altura,
}: {
  className: Readonly<{ base: string; focus: string }>;
  format: ElementFormatType | null;
  nodeKey: NodeKey;
  url: string;
  altura: number;
}) {
  const [editor] = useLexicalComposerContext();
  const verificado = verificarUrlEmbed(url);
  const editavel = editor.isEditable();

  const remover = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node) node.remove();
    });
  };

  const mudarAltura = () => {
    const valor = window.prompt('Altura em pixels:', String(altura));
    if (valor === null) return;
    const n = Number.parseInt(valor, 10);
    if (!Number.isFinite(n) || n < 200 || n > 1200) {
      window.alert('Use um valor entre 200 e 1200.');
      return;
    }
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isEmbedNode(node)) node.setAltura(n);
    });
  };

  return (
    <BlockWithAlignableContents className={className} format={format} nodeKey={nodeKey}>
      <div className="os-widget">
        {editavel && (
          <div className="os-widget__barra">
            <span>{verificado.ok ? verificado.rotulo : 'Incorporação'}</span>
            <span>
              <button type="button" onClick={mudarAltura}>altura</button>{' '}
              <button type="button" onClick={remover}>remover</button>
            </span>
          </div>
        )}
        {!verificado.ok ? (
          <div className="os-widget__erro">{verificado.motivo}</div>
        ) : (
          <>
            <iframe
              className="os-embed__quadro"
              src={verificado.url}
              height={altura}
              title={`${verificado.rotulo}: simulação incorporada`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
            <div className="os-embed__aviso">
              Conteúdo de {verificado.rotulo}.{' '}
              <a href={verificado.url} target="_blank" rel="noreferrer noopener">
                Abrir em nova aba
              </a>
            </div>
          </>
        )}
      </div>
    </BlockWithAlignableContents>
  );
}

export type SerializedEmbedNode = Spread<
  { url: string; altura: number },
  SerializedDecoratorBlockNode
>;

function converterElemento(domNode: HTMLElement): null | DOMConversionOutput {
  const url = domNode.getAttribute('data-os-embed');
  if (!url) return null;
  const altura = Number.parseInt(domNode.getAttribute('data-os-embed-altura') || '', 10);
  return { node: $createEmbedNode(url, Number.isFinite(altura) ? altura : undefined) };
}

export class EmbedNode extends DecoratorBlockNode {
  __url: string;
  __altura: number;

  static getType(): string {
    return 'os-embed';
  }

  static clone(node: EmbedNode): EmbedNode {
    return new EmbedNode(node.__url, node.__altura, node.__format, node.__key);
  }

  static importJSON(serialized: SerializedEmbedNode): EmbedNode {
    const node = $createEmbedNode(serialized.url, serialized.altura);
    node.setFormat(serialized.format);
    return node;
  }

  exportJSON(): SerializedEmbedNode {
    return {
      ...super.exportJSON(),
      type: 'os-embed',
      version: 1,
      url: this.__url,
      altura: this.__altura,
    };
  }

  constructor(url: string, altura = 480, format?: ElementFormatType, key?: NodeKey) {
    super(format, key);
    this.__url = url;
    this.__altura = altura;
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

  setAltura(altura: number): void {
    this.getWritable().__altura = altura;
  }

  getTextContent(): string {
    return this.__url;
  }

  decorate(_editor: unknown, config: EditorConfig): React.JSX.Element {
    const tema = config.theme.embedBlock || {};
    return (
      <EmbedComponent
        className={{ base: tema.base || '', focus: tema.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
        url={this.__url}
        altura={this.__altura}
      />
    );
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) =>
        domNode.hasAttribute('data-os-embed')
          ? { conversion: converterElemento, priority: 2 }
          : null,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.setAttribute('data-os-embed', this.__url);
    element.setAttribute('data-os-embed-altura', String(this.__altura));
    return { element };
  }
}

export function $createEmbedNode(url: string, altura?: number): EmbedNode {
  return new EmbedNode(url, altura);
}

export function $isEmbedNode(node: LexicalNode | null | undefined): node is EmbedNode {
  return node instanceof EmbedNode;
}
