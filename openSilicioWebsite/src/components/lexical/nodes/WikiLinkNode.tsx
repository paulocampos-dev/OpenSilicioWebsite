import type {
  DOMConversionMap,
  DOMConversionOutput,
  EditorConfig,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

import { LinkNode, SerializedLinkNode } from '@lexical/link';
import { addClassNamesToElement } from '@lexical/utils';

export type SerializedWikiLinkNode = Spread<
  {
    isPending?: boolean;
  },
  SerializedLinkNode
>;

export class WikiLinkNode extends LinkNode {
  __isPending: boolean;

  static getType(): string {
    return 'wikilink';
  }

  static clone(node: WikiLinkNode): WikiLinkNode {
    return new WikiLinkNode(
      node.__url,
      { rel: node.__rel, target: node.__target, title: node.__title },
      node.__isPending,
      node.__key,
    );
  }

  constructor(
    url: string,
    attributes?: { rel?: string | null; target?: string | null; title?: string | null },
    isPending?: boolean,
    key?: NodeKey,
  ) {
    super(url, attributes, key);
    this.__isPending = isPending ?? false;
  }

  static importJSON(serializedNode: SerializedWikiLinkNode): WikiLinkNode {
    const node = $createWikiLinkNode(
      serializedNode.url,
      {
        rel: serializedNode.rel || null,
        target: serializedNode.target || null,
        title: serializedNode.title || null,
      } as any,
      serializedNode.isPending,
    );
    return node;
  }

  exportJSON(): SerializedWikiLinkNode {
    return {
      ...super.exportJSON(),
      isPending: this.__isPending,
      type: 'wikilink',
      version: 1,
    };
  }

  createDOM(config: EditorConfig): HTMLAnchorElement {
    const element = super.createDOM(config) as unknown as HTMLAnchorElement;

    // Add custom class for wiki links
    addClassNamesToElement(element, 'wiki-link');

    // Add pending class if applicable
    if (this.__isPending) {
      addClassNamesToElement(element, 'wiki-link-pending');
    }

    return element;
  }

  updateDOM(
    prevNode: WikiLinkNode,
    anchor: HTMLAnchorElement,
    config: EditorConfig,
  ): boolean {
    const updated = super.updateDOM(prevNode as any, anchor as any, config);

    // Update pending class if status changed
    if (prevNode.__isPending !== this.__isPending) {
      if (this.__isPending) {
        addClassNamesToElement(anchor, 'wiki-link-pending');
      } else {
        anchor.classList.remove('wiki-link-pending');
      }
    }

    return updated;
  }

  getIsPending(): boolean {
    return this.__isPending;
  }

  setIsPending(isPending: boolean): void {
    const writable = this.getWritable();
    writable.__isPending = isPending;
  }

  static importDOM(): DOMConversionMap | null {
    return {
      // Só reivindica a âncora que é mesmo um verbete. O LinkNode registra
      // <a> na prioridade 1 e o Lexical desempata pelo último importer
      // registrado, que é este node: sem o filtro, todo link colado virava
      // wikilink, e um link externo ganhava a classe .wiki-link e a aparência
      // de termo interno. Devolver null faz o Lexical seguir para o LinkNode
      // e criar um link normal, como o `br` do próprio Lexical faz.
      a: (node: Node) =>
        ehLinkDeWiki(node) ? { conversion: convertAnchorElement, priority: 2 } : null,
    };
  }

  insertNewAfter(
    selection: any,
    restoreSelection = true,
  ): any {
    const element = this.getParentOrThrow().insertNewAfter(
      selection,
      restoreSelection,
    );
    if (element) {
      const linkNode = $createWikiLinkNode(
        this.__url,
        {
          rel: this.__rel,
          target: this.__target,
          title: this.__title,
        },
        this.__isPending,
      );
      (element as any).append(linkNode);
      return linkNode;
    }
    return null;
  }
}

/**
 * Uma âncora é verbete se veio do próprio editor, que marca a classe
 * `wiki-link` em createDOM, ou se aponta para a wiki. As duas checagens são
 * necessárias: o HTML da página do leitor traz a classe, e a URL cobre o
 * markdown escrito à mão. Note que a prioridade 2 acima só decide o caso do
 * verbete; para todo o resto o importer devolve null e sai da disputa.
 */
function ehLinkDeWiki(node: Node): boolean {
  if (!(node instanceof HTMLAnchorElement)) return false;
  if (node.classList.contains('wiki-link')) return true;
  const href = node.getAttribute('href');
  return href !== null && href.startsWith('/wiki/');
}

function convertAnchorElement(domNode: Node): DOMConversionOutput {
  let node = null;
  if (domNode instanceof HTMLAnchorElement) {
    const href = domNode.getAttribute('href');
    if (href !== null) {
      const isPending = domNode.classList.contains('wiki-link-pending');
      node = $createWikiLinkNode(
        href,
        {
          rel: domNode.getAttribute('rel'),
          target: domNode.getAttribute('target'),
          title: domNode.getAttribute('title'),
        },
        isPending,
      );
    }
  }
  return { node };
}

export function $createWikiLinkNode(
  url: string,
  attributes?: { rel?: string | null; target?: string | null; title?: string | null },
  isPending?: boolean,
): WikiLinkNode {
  return new WikiLinkNode(url, attributes, isPending);
}

export function $isWikiLinkNode(
  node: LexicalNode | null | undefined,
): node is WikiLinkNode {
  return node instanceof WikiLinkNode;
}
