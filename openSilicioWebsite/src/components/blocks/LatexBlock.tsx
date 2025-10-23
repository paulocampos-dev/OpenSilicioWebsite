import { defaultProps } from '@blocknote/core';
import { createReactBlockSpec, ReactCustomBlockRenderProps } from '@blocknote/react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Box, TextField } from '@mui/material';
import { useState } from 'react';

// Define the config for LaTeX block
const latexBlockConfig = {
  type: 'latex' as const,
  propSchema: {
    ...defaultProps,
    latex: {
      default: '',
    },
    inline: {
      default: false,
    },
  },
  content: 'none' as const,
};

type LatexBlockConfig = typeof latexBlockConfig;

// Render component for LaTeX block
export const LatexBlockComponent = (
  props: ReactCustomBlockRenderProps<
    LatexBlockConfig['type'],
    LatexBlockConfig['propSchema'],
    LatexBlockConfig['content']
  >
) => {
  const [isEditing, setIsEditing] = useState(!props.block.props.latex || props.block.props.latex === '');
  const [tempLatex, setTempLatex] = useState(props.block.props.latex);

  // Debug logging
  console.log('🔍 LatexBlockComponent render:', {
    blockId: props.block.id,
    latex: props.block.props.latex,
    isEditing,
    tempLatex,
    blockProps: props.block.props
  });

  const handleDoubleClick = () => {
    setIsEditing(true);
    setTempLatex(props.block.props.latex);
  };

  const handleBlur = () => {
    console.log('👁️ LatexBlock handleBlur called:', {
      blockId: props.block.id,
      tempLatex,
      currentLatex: props.block.props.latex,
      willUpdate: tempLatex !== props.block.props.latex
    });
    
    setIsEditing(false);
    if (tempLatex !== props.block.props.latex) {
      console.log('💾 Updating LaTeX block:', props.block.id, 'with:', tempLatex);
      props.editor.updateBlock(props.block, {
        props: { latex: tempLatex },
      });
    }
  };

  const handleCancel = () => {
    console.log('🚫 LatexBlock handleCancel called:', {
      blockId: props.block.id,
      latex: props.block.props.latex,
      willRemove: !props.block.props.latex || props.block.props.latex === ''
    });
    
    if (!props.block.props.latex || props.block.props.latex === '') {
      // If no latex is set, remove the block
      console.log('🗑️ Removing LaTeX block:', props.block.id);
      props.editor.removeBlocks([props.block]);
    } else {
      console.log('↩️ Cancelling edit mode for LaTeX block:', props.block.id);
      setIsEditing(false);
      setTempLatex(props.block.props.latex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!props.block || !props.block.props) {
    console.log('⚠️ LatexBlock missing props:', { block: props.block, props: props.block?.props });
    return <div>Loading...</div>;
  }

  return (
    <div
      ref={props.contentRef}
      onDoubleClick={handleDoubleClick}
      style={{
        display: props.block.props.inline ? 'inline-block' : 'block',
        cursor: 'pointer',
        padding: props.block.props.inline ? '2px 4px' : '8px',
        margin: props.block.props.inline ? '0 2px' : '8px 0',
      }}
    >
      {isEditing ? (
        <TextField
          value={tempLatex}
          onChange={(e) => setTempLatex(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          fullWidth={!props.block.props.inline}
          size="small"
          placeholder="Digite a equação LaTeX"
          helperText="Pressione Enter para salvar, Esc para cancelar"
        />
      ) : (
        <Box
          sx={{
            '& .katex-display': {
              margin: '0.5em 0',
            },
          }}
        >
          {(() => {
            try {
              return props.block.props.inline ? (
                <InlineMath math={props.block.props.latex} />
              ) : (
                <BlockMath math={props.block.props.latex} />
              );
            } catch (error) {
              console.error('❌ LaTeX rendering error:', error, 'for latex:', props.block.props.latex);
              return <div style={{ color: 'red' }}>LaTeX Error: {String(error)}</div>;
            }
          })()}
        </Box>
      )}
    </div>
  );
};

// Export the complete block spec
export const LatexBlock = createReactBlockSpec(latexBlockConfig, {
  render: LatexBlockComponent,
  toExternalHTML: (props) => {
    return props.block.props.inline ? (
      <span>
        <InlineMath math={props.block.props.latex} />
      </span>
    ) : (
      <div>
        <BlockMath math={props.block.props.latex} />
      </div>
    );
  },
  parse: (element) => {
    const text = element.textContent || '';
    const inlineMatch = text.match(/^\$(.*?)\$$/);
    const blockMatch = text.match(/^\$\$(.*?)\$\$$/s);

    if (blockMatch && blockMatch[1]) {
      return {
        latex: blockMatch[1]!.trim(),
        inline: false,
      };
    } else if (inlineMatch && inlineMatch[1]) {
      return {
        latex: inlineMatch[1]!.trim(),
        inline: true,
      };
    }

    return undefined;
  },
});
