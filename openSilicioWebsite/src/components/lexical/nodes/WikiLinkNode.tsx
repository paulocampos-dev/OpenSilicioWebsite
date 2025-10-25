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
        rel: serializedNode.rel,
        target: serializedNode.target,
        title: serializedNode.title,
      },
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
    const element = super.createDOM(config);

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
    const updated = super.updateDOM(prevNode, anchor, config);

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
      a: (node: Node) => ({
        conversion: convertAnchorElement,
        priority: 1,
      }),
    };
  }

  insertNewAfter(
    selection: any,
    restoreSelection = true,
  ): null | LexicalNode {
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
      element.append(linkNode);
      return linkNode;
    }
    return null;
  }
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
