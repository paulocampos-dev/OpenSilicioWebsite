import { useEffect, useMemo, useState } from 'react';
import { Box, Paper, Stack, Typography, useTheme } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block, BlockNoteEditor as BlockNoteEditorType } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { uploadApi } from '../services/api';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BlockNoteErrorBoundary from './BlockNoteErrorBoundary';

interface BlockNoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
}

function BlockNoteEditorInner({
  content,
  onContentChange,
  placeholder = 'Digite seu conteúdo aqui... (Digite "/" para ver comandos)',
}: BlockNoteEditorProps) {
  const theme = useTheme();
  const blockNoteTheme = theme.palette.mode === 'dark' ? 'dark' : 'light';
  const [isUploading, setIsUploading] = useState(false);

  // Parse initial content
  const initialContent = useMemo(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content) as Block[];
    } catch {
      // If content is not valid JSON, return undefined to start with empty editor
      return undefined;
    }
  }, []);

  // Create editor instance with custom upload function
  const editor = useCreateBlockNote({
    ...(initialContent ? { initialContent } : {}),
    uploadFile: async (file: File) => {
      setIsUploading(true);
      try {
        const result = await uploadApi.uploadFile(file);
        return result.url;
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
  });

  // Handle content changes
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      const blocks = editor.document;
      onContentChange(JSON.stringify(blocks));
    };

    // Listen to document changes
    const unsubscribe = editor.onChange(handleChange);

    // Cleanup listener on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [editor, onContentChange]);

  if (!editor) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
        <InfoOutlinedIcon sx={{ fontSize: 18, color: 'info.main' }} />
        <Typography variant="caption" color="text.secondary">
          Digite "/" para ver comandos • Clique nas imagens para redimensionar • Arraste blocos para reordenar
        </Typography>
      </Box>
      <Paper
        variant="outlined"
        sx={{
          overflow: 'hidden',
          '& .bn-container': {
            fontFamily: 'inherit',
          },
          '& .bn-editor': {
            padding: 3,
            minHeight: 400,
            fontSize: '1rem',
            lineHeight: 1.7,
          },
          // Style the editor content
          '& .ProseMirror': {
            outline: 'none',
            '& > *': {
              marginBottom: '0.75em',
            },
            '& h1': {
              fontSize: '2em',
              fontWeight: 700,
              marginTop: '0.5em',
              marginBottom: '0.5em',
              lineHeight: 1.2,
            },
            '& h2': {
              fontSize: '1.5em',
              fontWeight: 700,
              marginTop: '0.5em',
              marginBottom: '0.5em',
              lineHeight: 1.3,
            },
            '& h3': {
              fontSize: '1.25em',
              fontWeight: 600,
              marginTop: '0.5em',
              marginBottom: '0.5em',
              lineHeight: 1.4,
            },
            '& p': {
              marginBottom: '0.75em',
            },
            '& ul, & ol': {
              paddingLeft: '1.5em',
            },
            '& li': {
              marginBottom: '0.5em',
            },
            '& blockquote': {
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              paddingLeft: '1em',
              marginLeft: 0,
              fontStyle: 'italic',
              color: 'text.secondary',
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
              padding: '1em',
              borderRadius: '8px',
              overflow: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
            '& img': {
              maxWidth: '100%',
              height: 'auto',
              borderRadius: '8px',
            },
            // Make image resize handles more visible
            '& .bn-block-content[data-content-type="image"]': {
              '& img': {
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              },
              '&:hover img': {
                boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.3)',
              },
            },
            '& .bn-block-content[data-content-type="image"].ProseMirror-selectednode': {
              '& img': {
                boxShadow: '0 0 0 2px #1976d2',
              },
            },
            // Style the resize handles
            '& .bn-resize-handle': {
              backgroundColor: '#1976d2',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
            },
          },
          // Style the slash menu and other BlockNote UI
          '& .bn-slash-menu': {
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            boxShadow: 3,
          },
          '& .bn-slash-menu-item': {
            '&:hover': {
              backgroundColor: 'action.hover',
            },
            '&[data-selected="true"]': {
              backgroundColor: 'action.selected',
            },
          },
          // Style the formatting toolbar (appears when selecting blocks/images)
          '& .bn-formatting-toolbar': {
            backgroundColor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px',
            boxShadow: 3,
            padding: '4px',
          },
          '& .bn-toolbar-button': {
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
          // Style drag handle
          '& .bn-drag-handle': {
            opacity: 0.3,
            transition: 'opacity 0.2s',
            '&:hover': {
              opacity: 1,
            },
          },
        }}
      >
        <BlockNoteView
          editor={editor}
          theme={blockNoteTheme}
        />
      </Paper>
      {isUploading && (
        <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
          Enviando arquivo...
        </Box>
      )}
    </Stack>
  );
}

// Export wrapped component with error boundary
export default function BlockNoteEditor(props: BlockNoteEditorProps) {
  return (
    <BlockNoteErrorBoundary>
      <BlockNoteEditorInner {...props} />
    </BlockNoteErrorBoundary>
  );
}
