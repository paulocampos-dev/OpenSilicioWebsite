import { useEffect, useState } from 'react';
import { Box, useTheme, Skeleton, Stack } from '@mui/material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import LexicalErrorBoundary from './lexical/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { LinkNode } from '@lexical/link';
import { EquationNode } from './lexical/nodes/EquationNode';
import { WikiLinkNode } from './lexical/nodes/WikiLinkNode';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

interface LexicalContentProps {
  content: string;
}

function LexicalContentInner() {
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Small delay to ensure editor is fully initialized
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (isInitializing) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="text" width="60%" height={40} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
      </Stack>
    );
  }

  return <RichTextPlugin contentEditable={<ContentEditable />} placeholder={null} ErrorBoundary={LexicalErrorBoundary} />;
}

export default function LexicalContent({ content }: LexicalContentProps) {
  const theme = useTheme();

  // Don't render if no content or invalid format
  if (!content) {
    return (
      <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Nenhum conteúdo disponível.</Box>
    );
  }

  // Validate Lexical format
  try {
    const parsed = JSON.parse(content);
    // Lexical format must have a root object
    if (!parsed.root) {
      return (
        <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
          Nenhum conteúdo disponível. (Formato inválido - por favor, re-edite este item)
        </Box>
      );
    }
  } catch (error) {
    console.error('Error parsing content:', error);
    return (
      <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        Erro ao carregar conteúdo. (Por favor, re-edite este item)
      </Box>
    );
  }

  // Initial config for the read-only editor
  const initialConfig = {
    namespace: 'OpenSilicioContentViewer',
    theme: {},
    onError: (error: Error) => {
      console.error('Lexical content error:', error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      LinkNode,
      EquationNode,
      WikiLinkNode,
    ],
    editable: false,
    editorState: content,
  };

  return (
    <Box
      sx={{
        '& .ContentEditable__root': {
          outline: 'none',
          backgroundColor: 'transparent',
          '& > *': {
            marginBottom: '1.5em',
          },
          '& h1': {
            fontSize: { xs: '2rem', md: '2.5rem' },
            fontWeight: 700,
            marginTop: '0.5em',
            marginBottom: '0.5em',
            lineHeight: 1.2,
            color: 'text.primary',
          },
          '& h2': {
            fontSize: { xs: '1.5rem', md: '2rem' },
            fontWeight: 700,
            marginTop: '0.75em',
            marginBottom: '0.5em',
            lineHeight: 1.3,
            color: 'text.primary',
          },
          '& h3': {
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            fontWeight: 600,
            marginTop: '0.75em',
            marginBottom: '0.5em',
            lineHeight: 1.4,
            color: 'text.primary',
          },
          '& p': {
            fontSize: '1.125rem',
            lineHeight: 1.8,
            marginBottom: '1.5em',
            color: 'text.primary',
          },
          '& ul, & ol': {
            paddingLeft: { xs: 2, md: 3 },
            marginBottom: '1.5em',
            '& li': {
              fontSize: '1.125rem',
              lineHeight: 1.8,
              marginBottom: '0.5em',
              color: 'text.primary',
            },
          },
          '& blockquote': {
            borderLeft: '4px solid',
            borderColor: 'primary.main',
            paddingLeft: { xs: 1.5, md: 2 },
            marginLeft: 0,
            marginRight: 0,
            marginBottom: '1.5em',
            fontStyle: 'italic',
            color: 'text.secondary',
            fontSize: '1.125rem',
          },
          '& code': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          },
          '& pre': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            padding: 2,
            borderRadius: 2,
            overflow: 'auto',
            marginBottom: '1.5em',
            '& code': {
              backgroundColor: 'transparent',
              padding: 0,
              fontSize: '0.9rem',
            },
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& a.wiki-link': {
            fontWeight: 500,
            borderBottom: '2px solid',
            borderColor: 'primary.light',
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText',
            },
          },
          '& a.wiki-link-pending': {
            borderBottom: '2px dotted',
            borderColor: 'warning.main',
            color: 'warning.dark',
            cursor: 'help',
            '&:hover': {
              backgroundColor: 'warning.light',
              color: 'warning.contrastText',
            },
          },
          '& strong': {
            fontWeight: 700,
          },
          '& em': {
            fontStyle: 'italic',
          },
          '& .equation-node': {
            margin: '1em 0',
            textAlign: 'center',
          },
        },
      }}
    >
      <LexicalComposer initialConfig={initialConfig}>
        <LexicalErrorBoundary>
          <LexicalContentInner />
        </LexicalErrorBoundary>
      </LexicalComposer>
    </Box>
  );
}
