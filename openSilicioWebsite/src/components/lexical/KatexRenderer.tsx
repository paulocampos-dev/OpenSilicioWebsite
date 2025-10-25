import { useEffect, useRef, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNodeByKey, NodeKey } from 'lexical';

// KaTeX is loaded via CDN in index.html
declare const katex: {
  render: (
    equation: string,
    element: HTMLElement,
    options: {
      displayMode: boolean;
      errorColor: string;
      output: string;
      strict: string;
      throwOnError: boolean;
      trust: boolean;
    }
  ) => void;
};

export default function KatexRenderer({
  equation,
  inline,
  nodeKey,
  onDoubleClick,
}: Readonly<{
  equation: string;
  inline: boolean;
  nodeKey?: NodeKey;
  onDoubleClick?: () => void;
}>): JSX.Element {
  const katexElementRef = useRef<HTMLSpanElement>(null);
  const [editor] = useLexicalComposerContext();
  const [isHovered, setIsHovered] = useState(false);
  const isEditable = editor.isEditable();

  useEffect(() => {
    const katexElement = katexElementRef.current;
    if (katexElement !== null) {
      try {
        katex.render(equation, katexElement, {
          displayMode: !inline, // true = block mode, false = inline mode
          errorColor: '#cc0000',
          output: 'html',
          strict: 'warn',
          throwOnError: false,
          trust: false,
        });
      } catch (error) {
        katexElement.textContent = `Error rendering equation: ${equation}`;
        katexElement.style.color = '#cc0000';
      }
    }
  }, [equation, inline]);

  const handleDelete = () => {
    if (nodeKey) {
      editor.update(() => {
        const node = $getNodeByKey(nodeKey);
        if (node) {
          node.remove();
        }
      });
    }
  };

  return (
    <span
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        display: inline ? 'inline-block' : 'block',
        padding: inline ? '2px 4px' : '16px',
        margin: inline ? '0 2px' : '16px 0',
        backgroundColor: inline ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        borderRadius: '4px',
        cursor: onDoubleClick ? 'pointer' : 'default',
      }}
      title={onDoubleClick && nodeKey ? 'Clique duas vezes para editar' : undefined}
    >
      {/* Spacer images for cursor positioning (from Lexical Playground) */}
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        width="0"
        height="0"
        alt=""
        style={{ display: 'inline' }}
      />
      <span
        role={onDoubleClick ? 'button' : undefined}
        tabIndex={onDoubleClick ? -1 : undefined}
        onDoubleClick={onDoubleClick}
        ref={katexElementRef}
      />
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        width="0"
        height="0"
        alt=""
        style={{ display: 'inline' }}
      />
      {nodeKey && isHovered === true && isEditable === true && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: inline ? '-8px' : '4px',
            right: inline ? '-8px' : '4px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
            zIndex: 10,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
          }}
        >
          ✕
        </button>
      )}
    </span>
  );
}
