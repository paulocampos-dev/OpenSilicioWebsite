import { useMemo, useEffect, useState } from 'react';
import { Box, useTheme, CircularProgress, Skeleton, Stack } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import BlockNoteErrorBoundary from './BlockNoteErrorBoundary';

interface BlockNoteContentProps {
  content: string;
}

function BlockNoteContentInner({ content }: BlockNoteContentProps) {
  const theme = useTheme();
  const blockNoteTheme = theme.palette.mode === 'dark' ? 'dark' : 'light';
  const [isInitializing, setIsInitializing] = useState(true);

  // Parse the content
  const initialContent = useMemo(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content) as Block[];
    } catch {
      return undefined;
    }
  }, [content]);

  // Create a read-only editor instance
  const editor = useCreateBlockNote(
    initialContent ? { initialContent } : undefined
  );

  // Track when editor is ready
  useEffect(() => {
    if (editor) {
      // Small delay to ensure editor is fully initialized
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editor]);

  // Update editor content when content prop changes
  useEffect(() => {
    if (!editor || !initialContent) return;
    
    // Only update if content actually changed
    const currentContent = JSON.stringify(editor.document);
    const newContent = JSON.stringify(initialContent);
    
    if (currentContent !== newContent) {
      editor.replaceBlocks(editor.document, initialContent);
    }
  }, [editor, initialContent]);

  if (!content || !initialContent || initialContent.length === 0) {
    return (
      <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        Nenhum conteúdo disponível.
      </Box>
    );
  }

  if (!editor || isInitializing) {
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

  return (
    <Box
      sx={{
        // Style the read-only BlockNote view for public display
        '& .bn-container': {
          fontFamily: 'inherit',
          backgroundColor: 'transparent',
        },
        '& .bn-editor': {
          padding: 0,
          backgroundColor: 'transparent',
        },
        '& .ProseMirror': {
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
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
          },
          '& pre': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
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
          // Image styling - preserves width and alignment from editor
          '& [data-content-type="image"]': {
            marginTop: '2em',
            marginBottom: '2em',
            '& img': {
              borderRadius: 2,
              display: 'block',
              height: 'auto !important', // Preserve aspect ratio
            },
          },
          '& a': {
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
          '& strong': {
            fontWeight: 700,
          },
          '& em': {
            fontStyle: 'italic',
          },
        },
        // Hide editor UI elements (drag handles, etc) for read-only view
        '& .bn-drag-handle-menu': {
          display: 'none',
        },
        '& .bn-side-menu': {
          display: 'none',
        },
        '& .bn-block-outer': {
          paddingLeft: '0 !important',
        },
      }}
    >
      <BlockNoteView
        editor={editor}
        editable={false}
        theme={blockNoteTheme}
      />
    </Box>
  );
}

// Export wrapped component with error boundary
export default function BlockNoteContent(props: BlockNoteContentProps) {
  return (
    <BlockNoteErrorBoundary>
      <BlockNoteContentInner {...props} />
    </BlockNoteErrorBoundary>
  );
}
