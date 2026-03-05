import {
  DecoratorNode,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';
import { ReactElement, CSSProperties } from 'react';
import { Box } from '@mui/material';

export interface ImagePayload {
  altText: string;
  src: string;
  key?: NodeKey;
  loading?: boolean;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    src: string;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string;
  __altText: string;
  __loading: boolean;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key, node.__loading);
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, src } = serializedNode;
    const node = $createImageNode({
      altText,
      src,
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    element.setAttribute('style', 'max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;');
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (node: Node) => ({
        conversion: $convertImageElement,
        priority: 0,
      }),
    };
  }

  constructor(src: string, altText: string, key?: NodeKey, loading?: boolean) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__loading = loading || false;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      src: this.getSrc(),
      type: 'image',
      version: 1,
    };
  }

  // View

  createDOM(config: any): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    return span;
  }

  updateDOM(): false {
    return false;
  }

  getSrc(): string {
    return this.__src;
  }

  getAltText(): string {
    return this.__altText;
  }
  
  setSrc(src: string): void {
      const writable = this.getWritable();
      writable.__src = src;
      writable.__loading = false;
  }

  decorate(): ReactElement {
    return (
      <Box sx={{ my: 2, display: 'flex', justifyContent: 'center', opacity: this.__loading ? 0.5 : 1 }}>
        <img
          src={this.__src}
          alt={this.__altText}
          style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
        />
      </Box>
    );
  }
}

export function $createImageNode({ altText, src, key, loading }: ImagePayload): ImageNode {
  return new ImageNode(src, altText, key, loading);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src } = domNode;
    const node = $createImageNode({ altText, src });
    return { node };
  }
  return null;
}
