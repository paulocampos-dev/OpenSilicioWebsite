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
import * as React from 'react';
import { Suspense, ReactElement, CSSProperties, useRef, useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ImageLightbox } from '../ImageLightbox';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import { $getNodeByKey, COMMAND_PRIORITY_LOW, DRAGSTART_COMMAND, KEY_BACKSPACE_COMMAND, KEY_DELETE_COMMAND, SELECTION_CHANGE_COMMAND, CLICK_COMMAND } from 'lexical';

export interface ImagePayload {
  altText: string;
  src: string;
  key?: NodeKey;
  loading?: boolean;
  width?: 'inherit' | number | string | undefined;
  height?: 'inherit' | number | string | undefined;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    src: string;
    width?: 'inherit' | number | string;
    height?: 'inherit' | number | string;
  },
  SerializedLexicalNode
>;

// ------------------------------------------------------------------------------------------------
// Component View for Lexical Decorator
// ------------------------------------------------------------------------------------------------
function ImageResizer({
  onResizeStart,
  onResizeEnd,
  buttonRef,
  imageRef,
}: {
  onResizeStart: () => void;
  onResizeEnd: (width: 'inherit' | number, height: 'inherit' | number) => void;
  buttonRef: { current: null | HTMLElement };
  imageRef: { current: null | HTMLElement };
}) {
  const positioningRef = useRef<{
    currentWidth: 'inherit' | number;
    currentHeight: 'inherit' | number;
    ratio: number;
    startWidth: number;
    startHeight: number;
    startX: number;
    startY: number;
    direction: number;
    isResizing: boolean;
  }>({
    currentWidth: 0,
    currentHeight: 0,
    ratio: 0,
    startWidth: 0,
    startHeight: 0,
    startX: 0,
    startY: 0,
    direction: 0,
    isResizing: false,
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>, direction: number) => {
    if (!imageRef.current) return;
    const image = imageRef.current;

    // Disable interaction globally while dragging
    const body = document.body;
    body.style.userSelect = 'none';

    // Setup initial coordinates
    const { width, height } = image.getBoundingClientRect();
    const positioning = positioningRef.current;
    positioning.startWidth = width;
    positioning.startHeight = height;
    positioning.ratio = width / height;
    positioning.currentWidth = width;
    positioning.currentHeight = height;
    positioning.startX = event.clientX;
    positioning.startY = event.clientY;
    positioning.isResizing = true;
    positioning.direction = direction;

    onResizeStart();
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  };

  const handlePointerMove = (event: PointerEvent) => {
    const image = imageRef.current;
    const positioning = positioningRef.current;

    const isHorizontal = positioning.direction & (1 << 0) || positioning.direction & (1 << 2);
    let diff = Math.floor(positioning.startX - event.clientX);

    // Direction calculation modifier
    if (positioning.direction === 2 /* East */) {
      diff = -diff;
    }

    let width = positioning.startWidth + diff;
    let height = width / positioning.ratio;

    if (width > 50 && image) {
      image.style.width = width + 'px';
      image.style.height = height + 'px';
      positioning.currentWidth = width;
      positioning.currentHeight = height;
    }
  };

  const handlePointerUp = () => {
    const image = imageRef.current;
    const positioning = positioningRef.current;
    const body = document.body;

    body.style.userSelect = '';
    if (image && positioning.isResizing) {
      const width = positioning.currentWidth;
      const height = positioning.currentHeight;
      positioning.isResizing = false;

      onResizeEnd(width, height);
    }

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  };

  // 1 = West, 2 = East
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
      <div
        className="image-resizer image-resizer-e"
        style={{
          position: 'absolute',
          right: -8,
          top: '50%',
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: '#0070f3',
          transform: 'translateY(-50%)',
          cursor: 'ew-resize',
          zIndex: 100,
        }}
        onPointerDown={(event) => handlePointerDown(event, 2)}
      />
    </div>
  );
}

const ImageComponent = ({
  src,
  altText,
  nodeKey,
  width,
  height,
  loading,
}: {
  src: string;
  altText: string;
  nodeKey: NodeKey;
  width: 'inherit' | number | string;
  height: 'inherit' | number | string;
  loading: boolean;
}): React.JSX.Element => {
  const imageRef = useRef<null | HTMLImageElement>(null);
  const buttonRef = useRef<null | HTMLButtonElement>(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [editor] = useLexicalComposerContext();
  const activeEditorRef = useRef<null | LexicalEditor>(editor);
  const [selection, setSelection] = useState<any>(null);
  const isEditable = editor.isEditable();

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => null)); // Force a rerender on arbitrary changes for selection borders
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor;
          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          const event = payload;
          if (isResizing) return true;

          if (event.target === imageRef.current) {
            if (isEditable) {
              clearSelection();
              setSelected(true);
            } else {
              setIsLightboxOpen(true);
            }
            return true;
          }

          return false;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            event.preventDefault(); // Disable drag to prevent confusion with drag resizing if selected
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [clearSelection, editor, isResizing, setSelected]);

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    setIsResizing(false);

    // Convert numbers to px strings for persistence if needed, but our type allows mixed
    const nextWidthVal = typeof nextWidth === 'number' ? nextWidth + 'px' : nextWidth;
    const nextHeightVal = typeof nextHeight === 'number' ? nextHeight + 'px' : nextHeight;

    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidthAndHeight(nextWidthVal, nextHeightVal);
      }
    });
  };

  const onResizeStart = () => {
    setIsResizing(true);
  };

  return (
    <>
      <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', opacity: loading ? 0.5 : 1 }}>
        <Box sx={{ position: 'relative' }}>
          <img
            src={src}
            alt={altText}
            ref={imageRef}
            onClick={() => !isEditable && setIsLightboxOpen(true)}
            style={{
              width,
              height,
              maxWidth: '100%',
              borderRadius: '8px',
              border: isSelected ? '2px solid #0070f3' : '2px solid transparent',
              display: 'block',
              cursor: !isEditable ? 'zoom-in' : 'default',
            }}
          />
          {isSelected && !loading && isEditable && (
            <ImageResizer
              onResizeStart={onResizeStart}
              onResizeEnd={onResizeEnd}
              buttonRef={buttonRef}
              imageRef={imageRef}
            />
          )}
        </Box>
      </Box>

      <ImageLightbox
        open={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        src={src}
        alt={altText}
      />
    </>
  );
};


// ------------------------------------------------------------------------------------------------
// Lexical Decorator Node Architecture
// ------------------------------------------------------------------------------------------------
export class ImageNode extends DecoratorNode<ReactElement> {
  __src: string;
  __altText: string;
  __width: 'inherit' | number | string;
  __height: 'inherit' | number | string;
  __loading: boolean;

  static getType(): string {
    return 'image';
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key, node.__loading, node.__width, node.__height);
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, src, width, height } = serializedNode;
    const node = $createImageNode({
      altText,
      src,
      width: width || 'inherit',
      height: height || 'inherit',
    });
    return node;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    const w = this.__width === 'inherit' ? 'max-width: 100%;' : `width: ${this.__width};`;
    const h = this.__height === 'inherit' ? 'height: auto;' : `height: ${this.__height};`;
    element.setAttribute('style', `${w} ${h} border-radius: 8px; margin: 16px 0; display: block;`);
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

  constructor(src: string, altText: string, key?: NodeKey, loading?: boolean, width?: 'inherit' | number | string, height?: 'inherit' | number | string) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || '100%';
    this.__height = height || 'auto';
    this.__loading = loading || false;
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.getAltText(),
      src: this.getSrc(),
      width: this.__width,
      height: this.__height,
      type: 'image',
      version: 1,
    };
  }

  setWidthAndHeight(width: 'inherit' | number | string, height: 'inherit' | number | string): void {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  createDOM(config: any): HTMLElement {
    const span = document.createElement('span');
    const theme = config.theme;
    const className = theme.image;
    if (className !== undefined) {
      span.className = className;
    }
    span.style.userSelect = 'none'; // Essential for proper selection handling globally
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

  isLoading(): boolean {
    return this.__loading;
  }

  decorate(): ReactElement {
    return (
      <Suspense fallback={null}>
        <ImageComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          nodeKey={this.getKey()}
          loading={this.__loading}
        />
      </Suspense>
    );
  }
}

export function $createImageNode({ altText, src, key, loading, width, height }: ImagePayload): ImageNode {
  return new ImageNode(src, altText, key, loading, width, height);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}

function $convertImageElement(domNode: Node): null | DOMConversionOutput {
  if (domNode instanceof HTMLImageElement) {
    const { alt: altText, src, width, height } = domNode;

    // If it has explicit inline styles for width/height respect those primarily
    const inlineWidth = domNode.style.width || (width ? `${width}px` : undefined);
    const inlineHeight = domNode.style.height || (height ? `${height}px` : undefined);

    const node = $createImageNode({
      altText,
      src,
      width: inlineWidth as 'inherit' | number | string | undefined,
      height: inlineHeight as 'inherit' | number | string | undefined
    });
    return { node };
  }
  return null;
}
