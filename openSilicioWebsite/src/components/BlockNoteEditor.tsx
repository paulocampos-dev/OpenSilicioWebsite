import { useEffect, useMemo, useState, useRef } from 'react';
import { Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import { BlockNoteView } from '@blocknote/mantine';
import { useCreateBlockNote, getDefaultReactSlashMenuItems, SuggestionMenuController } from '@blocknote/react';
import { Block, BlockNoteEditor as BlockNoteEditorType, filterSuggestionItems } from '@blocknote/core';
import '@blocknote/mantine/style.css';
import 'katex/dist/katex.min.css';
import { uploadApi } from '../services/api';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkIcon from '@mui/icons-material/Link';
import FunctionsIcon from '@mui/icons-material/Functions';
import YouTubeIcon from '@mui/icons-material/YouTube';
import BlockNoteErrorBoundary from './BlockNoteErrorBoundary';
import WikiLinkInserter from './WikiLinkInserter';
import { customSchema } from './blockNoteSchema';

interface BlockNoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  contentType?: 'blog' | 'education';
  contentId?: string;
  onBeforeWikiLink?: () => Promise<any>;
}

// Helper function to extract YouTube ID from URL
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get custom slash menu items including LaTeX and YouTube
function getCustomSlashMenuItems(
  editor: BlockNoteEditorType<typeof customSchema>, 
  onContentChange: (content: string) => void,
  isCreatingBlock: React.MutableRefObject<boolean>
) {
  return [
    ...getDefaultReactSlashMenuItems(editor),
    {
      title: 'Equação LaTeX',
      onItemClick: () => {
        console.log('🎯 LaTeX slash menu item clicked');
        isCreatingBlock.current = true;
        
        const currentBlock = editor.getTextCursorPosition().block;
        const isEmpty = currentBlock.content === undefined ||
                       (Array.isArray(currentBlock.content) && currentBlock.content.length === 0);

        console.log('📝 Current block state:', {
          blockId: currentBlock.id,
          blockType: currentBlock.type,
          isEmpty,
          content: currentBlock.content
        });

        if (isEmpty) {
          console.log('🔄 Updating current block to LaTeX');
          editor.updateBlock(currentBlock, {
            type: 'latex',
            props: { latex: '' },
          });
          // Immediately update the content to prevent sync issues
          const newContent = JSON.stringify(editor.document);
          console.log('🚀 Immediately updating content prop:', newContent);
          onContentChange(newContent);
        } else {
          console.log('➕ Inserting new LaTeX block after current block');
          editor.insertBlocks(
            [
              {
                type: 'latex',
                props: { latex: '' },
              },
            ],
            currentBlock,
            'after'
          );
          // Immediately update the content to prevent sync issues
          const newContent = JSON.stringify(editor.document);
          console.log('🚀 Immediately updating content prop:', newContent);
          onContentChange(newContent);
        }
        
        // Reset the flag after a short delay
        setTimeout(() => {
          isCreatingBlock.current = false;
        }, 100);
      },
      aliases: ['latex', 'math', 'equation', 'formula', 'equação', 'matemática'],
      group: 'Mídia',
      icon: <FunctionsIcon />,
      subtext: 'Inserir uma equação matemática em LaTeX',
    },
    {
      title: 'Vídeo do YouTube',
      onItemClick: () => {
        const currentBlock = editor.getTextCursorPosition().block;
        const isEmpty = currentBlock.content === undefined ||
                       (Array.isArray(currentBlock.content) && currentBlock.content.length === 0);

        if (isEmpty) {
          editor.updateBlock(currentBlock, {
            type: 'youtube',
            props: { videoId: '', url: '', width: 100 },
          });
        } else {
          editor.insertBlocks(
            [
              {
                type: 'youtube',
                props: { videoId: '', url: '', width: 100 },
              },
            ],
            currentBlock,
            'after'
          );
        }
      },
      aliases: ['youtube', 'video', 'vídeo', 'yt'],
      group: 'Mídia',
      icon: <YouTubeIcon />,
      subtext: 'Incorporar um vídeo do YouTube',
    },
  ];
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
  const isCreatingBlock = useRef(false);

  // Parse initial content
  const initialContent = useMemo(() => {
    console.log('📋 Parsing initial content:', { content });
    if (!content) return undefined;
    try {
      const parsed = JSON.parse(content) as Block[];
      console.log('✅ Successfully parsed content:', parsed);
      return parsed;
    } catch (error) {
      console.log('❌ Failed to parse content, using undefined:', error);
      // If content is not valid JSON, return undefined to start with empty editor
      return undefined;
    }
  }, [content]); // Add content as dependency

  // Create editor instance with custom schema and upload function
  const editor = useCreateBlockNote({
    schema: customSchema,
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

  // Auto-embed YouTube URLs when pasted
  useEffect(() => {
    if (!editor) return;

    const handlePaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text/plain');
      if (!text) return;

      const videoId = extractYouTubeId(text);
      if (videoId) {
        event.preventDefault();
        editor.insertBlocks(
          [
            {
              type: 'youtube',
              props: { videoId, url: text, width: 100 },
            },
          ],
          editor.getTextCursorPosition().block,
          'after'
        );
      }
    };

    const editorElement = editor.domElement;
    if (editorElement) {
      editorElement.addEventListener('paste', handlePaste);
      return () => {
        editorElement.removeEventListener('paste', handlePaste);
      };
    }
  }, [editor]);

  // Update editor content when content prop changes (e.g., when loading a post)
  useEffect(() => {
    if (!editor || !content) return;
    
    // Skip updates when we're creating a block to prevent conflicts
    if (isCreatingBlock.current) {
      console.log('⏸️ Skipping content update - creating block');
      return;
    }
    
    try {
      const newBlocks = JSON.parse(content) as Block[];
      const currentBlocks = editor.document;
      
      console.log('🔄 Content prop changed, comparing:', {
        currentBlocksCount: currentBlocks.length,
        newBlocksCount: newBlocks.length,
        currentBlocks: currentBlocks.map(b => ({ id: b.id, type: b.type, props: b.props })),
        newBlocks: newBlocks.map(b => ({ id: b.id, type: b.type, props: b.props }))
      });
      
      // Only update if content is different to avoid infinite loops
      if (JSON.stringify(currentBlocks) !== content) {
        console.log('🔄 Updating editor from prop content');
        isUpdatingFromProp.current = true;
        editor.replaceBlocks(editor.document, newBlocks);
        // Reset the flag after a short delay to allow the change to propagate
        setTimeout(() => {
          isUpdatingFromProp.current = false;
        }, 100);
      } else {
        console.log('⏭️ Skipping update - content is the same');
      }
    } catch (error) {
      console.error('❌ Error updating editor content:', error);
    }
  }, [editor, content]);

  // Handle content changes from user edits
  useEffect(() => {
    if (!editor) return;

    const handleChange = () => {
      // Don't trigger onChange if we're updating from the prop
      if (isUpdatingFromProp.current) {
        console.log('⏸️ Skipping onChange - updating from prop');
        return;
      }
      
      const blocks = editor.document;
      const contentString = JSON.stringify(blocks);
      console.log('📄 Editor document changed:', {
        blockCount: blocks.length,
        blocks: blocks.map(b => ({ id: b.id, type: b.type, props: b.props })),
        contentLength: contentString.length
      });
      console.log('📤 Calling onContentChange with:', contentString);
      onContentChange(contentString);
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
          slashMenu={false}
        >
          <SuggestionMenuController
            triggerCharacter={'/'}
            getItems={async (query) =>
              filterSuggestionItems(getCustomSlashMenuItems(editor, onContentChange, isCreatingBlock), query)
            }
          />
        </BlockNoteView>
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
