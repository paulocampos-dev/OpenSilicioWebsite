import { useEffect, useRef } from 'react';

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
  onDoubleClick,
}: Readonly<{
  equation: string;
  inline: boolean;
  onDoubleClick?: () => void;
}>): JSX.Element {
  const katexElementRef = useRef<HTMLSpanElement>(null);

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

  return (
    <>
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
        style={{ cursor: onDoubleClick ? 'pointer' : 'default' }}
      />
      <img
        src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        width="0"
        height="0"
        alt=""
        style={{ display: 'inline' }}
      />
    </>
  );
}
