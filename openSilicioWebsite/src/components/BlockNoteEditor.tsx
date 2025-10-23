import { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote } from '@blocknote/react';
import { Block } from '@blocknote/core';
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

  // Parse initial content only once on mount
  // Content updates after mount are handled by the useEffect below
  const initialContent = useMemo(() => {
    console.log('🔄 [INIT] Parsing initial content', {
      contentId,
      contentType,
      contentLength: content?.length,
      hasContent: !!content
    });
    if (!content) return undefined;
    try {
      const parsed = JSON.parse(content) as Block[];
      console.log('✅ [INIT] Successfully parsed initial content', {
        blockCount: parsed.length,
        blockTypes: parsed.map(b => b.type)
      });
      return parsed;
    } catch (error) {
      console.error('❌ [INIT] Failed to parse initial content:', error);
      // If content is not valid JSON, return undefined to start with empty editor
      return undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentId, contentType]); // Only re-parse when loading a different document

  // Create editor instance with upload function
  const editor = useCreateBlockNote({
    ...(initialContent ? { initialContent } : {}),
    uploadFile: async (file: File) => {
      console.log('📤 [UPLOAD] Starting file upload', { fileName: file.name, fileSize: file.size });
      setIsUploading(true);
      try {
        const result = await uploadApi.uploadFile(file);
        console.log('✅ [UPLOAD] File uploaded successfully', { url: result.url });
        return result.url;
      } catch (error) {
        console.error('❌ [UPLOAD] Upload error:', error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
  });

  console.log('🎯 [EDITOR] Editor instance', {
    exists: !!editor,
    documentBlockCount: editor?.document?.length,
    contentId,
    contentType
  });


  // Update editor content when loading a different document
  // Note: This effect should only run when contentId/contentType changes,
  // not when switching between preview/edit modes
  useEffect(() => {
    console.log('🔄 [SYNC] Content sync effect triggered', {
      hasEditor: !!editor,
      hasContent: !!content,
      contentId,
      contentType,
      isUpdatingFromProp: isUpdatingFromProp.current
    });

    if (!editor || !content) {
      console.log('⏭️ [SYNC] Skipping - no editor or content');
      return;
    }

    try {
      const newBlocks = JSON.parse(content) as Block[];
      const currentBlocks = editor.document;

      console.log('📊 [SYNC] Comparing blocks', {
        currentBlockCount: currentBlocks.length,
        newBlockCount: newBlocks.length,
        currentTypes: currentBlocks.map(b => `${b.type}(${b.id.slice(0, 8)})`),
        newTypes: newBlocks.map(b => `${b.type}(${b.id.slice(0, 8)})`)
      });

      // Normalize both for comparison to avoid false positives from formatting differences
      const currentContent = JSON.stringify(currentBlocks);
      const newContent = JSON.stringify(newBlocks);

      // Only update if content is actually different
      if (currentContent !== newContent) {
        console.log('🔄 [SYNC] Content is different, updating editor');
        isUpdatingFromProp.current = true;

        // Use replaceBlocks but handle errors gracefully
        try {
          editor.replaceBlocks(editor.document, newBlocks);
          console.log('✅ [SYNC] Blocks replaced successfully');
        } catch (replaceError) {
          console.error('❌ [SYNC] Failed to replace blocks:', replaceError);
          console.error('❌ [SYNC] Error stack:', (replaceError as Error).stack);
          // Don't throw or reload - just log the warning and let the editor continue
          // This is important for preserving user edits
        }

        // Reset the flag after the change has propagated
        setTimeout(() => {
          console.log('🏁 [SYNC] Reset isUpdatingFromProp flag');
          isUpdatingFromProp.current = false;
        }, 100);
      } else {
        console.log('⏭️ [SYNC] Content is the same, skipping update');
      }
    } catch (error) {
      console.error('❌ [SYNC] Error parsing editor content:', error);
    }
    // Only trigger when loading a different document, not on every content change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, contentId, contentType]);

  // Handle content changes from user edits
  useEffect(() => {
    if (!editor) return;

    console.log('📝 [CHANGE] Setting up onChange listener');

    const handleChange = () => {
      // Don't trigger onChange if we're updating from the prop
      if (isUpdatingFromProp.current) {
        console.log('⏸️ [CHANGE] Skipping onChange - updating from prop');
        return;
      }

      const blocks = editor.document;
      const contentString = JSON.stringify(blocks);
      console.log('📤 [CHANGE] Content changed by user', {
        blockCount: blocks.length,
        blockTypes: blocks.map(b => `${b.type}(${b.id.slice(0, 8)})`),
        contentLength: contentString.length
      });
      onContentChange(contentString);
    };

    // Listen to document changes
    const unsubscribe = editor.onChange(handleChange);

    // Cleanup listener on unmount
    return () => {
      console.log('🧹 [CHANGE] Cleaning up onChange listener');
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
          key={`editor-${contentType}-${contentId || 'new'}`}
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
