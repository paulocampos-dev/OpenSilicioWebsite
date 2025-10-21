import { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block, BlockNoteEditor as BlockNoteEditorType } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import { uploadApi } from '../services/api';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkIcon from '@mui/icons-material/Link';
import BlockNoteErrorBoundary from './BlockNoteErrorBoundary';
import WikiLinkInserter from './WikiLinkInserter';

interface BlockNoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  contentType?: 'blog' | 'education';
  contentId?: string;
  onBeforeWikiLink?: () => Promise<any>;
}

function BlockNoteEditorInner({
  content,
  onContentChange,
  placeholder = 'Digite seu conteúdo aqui... (Digite "/" para ver comandos)',
  contentType,
  contentId,
  onBeforeWikiLink,
}: BlockNoteEditorProps) {
  const theme = useTheme();
  const blockNoteTheme = theme.palette.mode === 'dark' ? 'dark' : 'light';
  const [isUploading, setIsUploading] = useState(false);
  const [wikiLinkDialogOpen, setWikiLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const isUpdatingFromProp = useRef(false);

  // Parse initial content
  const initialContent = useMemo(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content) as Block[];
    } catch {
      // If content is not valid JSON, return undefined to start with empty editor
      return undefined;
    }
  }, [content]); // Add content as dependency

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

  // Update editor content when content prop changes (e.g., when loading a post)
  useEffect(() => {
    if (!editor || !content) return;
    
    try {
      const newBlocks = JSON.parse(content) as Block[];
      const currentBlocks = editor.document;
      
      // Only update if content is different to avoid infinite loops
      if (JSON.stringify(currentBlocks) !== content) {
        isUpdatingFromProp.current = true;
        editor.replaceBlocks(editor.document, newBlocks);
        // Reset the flag after a short delay to allow the change to propagate
        setTimeout(() => {
          isUpdatingFromProp.current = false;
        }, 100);
      }
    } catch (error) {
      console.error('Error updating editor content:', error);
    }
  }, [editor, content]);

  // Handle content changes from user edits
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      // Don't trigger onChange if we're updating from the prop
      if (isUpdatingFromProp.current) return;
      
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

  // Handle opening wiki link dialog
  const handleOpenWikiLink = async () => {
    if (!editor) return;
    
    // Auto-save before opening dialog if callback is provided
    if (onBeforeWikiLink) {
      try {
        await onBeforeWikiLink();
      } catch (error) {
        console.error('Error saving before wiki link:', error);
        // Continue anyway - user can still link to existing entries
      }
    }
    
    const selected = editor.getSelectedText();
    setSelectedText(selected);
    setWikiLinkDialogOpen(true);
  };

  // Handle inserting wiki link
  const handleInsertWikiLink = (term: string, slug: string) => {
    if (!editor) return;
    const url = `/wiki/${slug}`;
    // If there's selected text, createLink will replace it with the link
    // Otherwise, we'll use the term as the link text
    if (selectedText) {
      editor.createLink(url);
    } else {
      editor.createLink(url, term);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: 'info.main' }} />
          <Typography variant="caption" color="text.secondary">
            Digite "/" para ver comandos • Clique nas imagens para redimensionar • Arraste blocos para reordenar
          </Typography>
        </Box>
        {contentType && (
          <Button
            size="small"
            variant="outlined"
            startIcon={<LinkIcon />}
            onClick={handleOpenWikiLink}
            sx={{ whiteSpace: 'nowrap' }}
          >
            Adicionar Link da Wiki
          </Button>
        )}
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

      {contentType && (
        <WikiLinkInserter
          open={wikiLinkDialogOpen}
          onClose={() => setWikiLinkDialogOpen(false)}
          onInsert={handleInsertWikiLink}
          selectedText={selectedText}
          {...(contentId ? { contentType, contentId } : {})}
        />
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
