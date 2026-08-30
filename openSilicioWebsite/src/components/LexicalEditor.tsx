import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Button, Paper, Stack, Typography, useTheme } from '@mui/material';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from './lexical/LexicalErrorBoundary';
import { EditorState } from 'lexical';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkIcon from '@mui/icons-material/Link';
import WikiLinkInserter from './WikiLinkInserter';
import EquationPlugin from './lexical/plugins/EquationPlugin';
import WikiLinkPlugin, { INSERT_WIKI_LINK_COMMAND } from './lexical/plugins/WikiLinkPlugin';
import YouTubePlugin from './lexical/plugins/YouTubePlugin';
import ToolbarPlugin from './lexical/plugins/ToolbarPlugin';
import ImagePlugin from './lexical/plugins/ImagePlugin';
import ImageGalleryPlugin from './lexical/plugins/ImageGalleryPlugin';
import ContextMenuPlugin from './lexical/plugins/ContextMenuPlugin';
import MarkdownPastePlugin from './lexical/plugins/MarkdownPastePlugin';
import { LEXICAL_NODES } from './lexical/nodeSet';
import { EDITOR_TRANSFORMERS } from './lexical/transformers';
import { OsWidgetPlugins } from './lexical/widgets';

interface LexicalEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  contentType?: 'blog' | 'education';
  contentId?: string | undefined;
  onBeforeWikiLink?: () => Promise<any>;
}

// Separate component to access editor context
function WikiLinkButton({
  onOpenWikiLink,
  contentType,
}: {
  onOpenWikiLink: () => void;
  contentType?: 'blog' | 'education' | string;
}) {
  if (!contentType) return null;

  return (
    <Button
      size="small"
      variant="outlined"
      startIcon={<LinkIcon />}
      onClick={onOpenWikiLink}
      sx={{ whiteSpace: 'nowrap' }}
    >
      Adicionar Link da Wiki
    </Button>
  );
}

function LexicalEditorInner({
  content,
  onContentChange,
  placeholder = 'Digite seu conteúdo aqui...',
  contentType,
  contentId,
  onBeforeWikiLink,
}: LexicalEditorProps) {
  const theme = useTheme();
  const [editor] = useLexicalComposerContext();
  const [wikiLinkDialogOpen, setWikiLinkDialogOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const isUpdatingFromProp = useRef(false);

  // Update editor when content prop changes (for loading different documents)
  useEffect(() => {
    if (!content || isUpdatingFromProp.current) return;

    try {
      const parsed = JSON.parse(content);
      // Skip if invalid Lexical format (no root)
      if (!parsed.root) {
        console.warn('Invalid Lexical format detected, content will not be loaded');
        return;
      }

      const newEditorState = editor.parseEditorState(content);
      const currentState = editor.getEditorState();

      // Only update if content is actually different
      const currentJSON = JSON.stringify(currentState.toJSON());
      const newJSON = JSON.stringify(newEditorState.toJSON());

      if (currentJSON !== newJSON) {
        isUpdatingFromProp.current = true;
        editor.setEditorState(newEditorState);
        setTimeout(() => {
          isUpdatingFromProp.current = false;
        }, 100);
      }
    } catch (error) {
      console.error('Error updating editor state:', error);
    }
  }, [editor, content, contentId, contentType]);

  // Handle content changes
  const handleChange = useCallback(
    (editorState: EditorState) => {
      if (isUpdatingFromProp.current) return;

      const json = JSON.stringify(editorState.toJSON());
      onContentChange(json);
    },
    [onContentChange],
  );

  // Handle opening wiki link dialog
  const handleOpenWikiLink = async () => {
    if (onBeforeWikiLink) {
      try {
        await onBeforeWikiLink();
      } catch (error) {
        console.error('Error saving before wiki link:', error);
      }
    }

    // Get selected text
    const selection = window.getSelection();
    const selected = selection?.toString() || '';
    setSelectedText(selected);
    setWikiLinkDialogOpen(true);
  };

  // Handle inserting wiki link
  const handleInsertWikiLink = (term: string, slug: string) => {
    const url = `/wiki/${slug}`;
    const isPending = slug.startsWith('pending-');

    editor.dispatchCommand(INSERT_WIKI_LINK_COMMAND, {
      url,
      text: selectedText || term,
      isPending,
    });
  };

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          px: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: 'info.main' }} />
          <Typography variant="caption" color="text.secondary">
            Formate o texto na barra de ferramentas • Clique em uma imagem para redimensionar ou excluir
            • Arraste imagens para o editor • Cole ou solte várias imagens para criar galerias
          </Typography>
        </Box>
        <WikiLinkButton onOpenWikiLink={handleOpenWikiLink} {...(contentType ? { contentType } : {})} />
      </Box>

      <Paper
        variant="outlined"
        sx={{
          overflow: 'hidden',
          '& .editor-container': {
            position: 'relative',
            background: 'transparent',
          },
          '& .editor-inner': {
            background: 'transparent',
            position: 'relative',
          },
          '& .editor-input': {
            padding: 2,
            minHeight: 300,
            fontSize: '1rem',
            lineHeight: 1.7,
            outline: 'none',
            transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
            '&:focus-within': {
              backgroundColor:
                theme.palette.mode === 'dark' ? 'rgba(144, 202, 249, 0.04)' : 'rgba(25, 118, 210, 0.03)',
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
              padding: '1em',
              borderRadius: '8px',
              overflow: 'auto',
              '& code': {
                backgroundColor: 'transparent',
                padding: 0,
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
            },
            '& a.wiki-link-pending': {
              borderBottom: '2px dotted',
              borderColor: 'warning.main',
              color: 'warning.dark',
            },
          },
          '& .editor-placeholder': {
            color: 'text.disabled',
            overflow: 'hidden',
            position: 'absolute',
            top: '24px',
            left: '24px',
            userSelect: 'none',
            pointerEvents: 'none',
          },
        }}
      >
        <div className="editor-container">
          <ToolbarPlugin />
          <div className="editor-inner">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<div className="editor-placeholder">{placeholder}</div>}
              ErrorBoundary={LexicalErrorBoundary as any}
            />
            <OnChangePlugin onChange={handleChange} />
            <HistoryPlugin />
            <LinkPlugin />
            <ListPlugin />
            <MarkdownShortcutPlugin transformers={EDITOR_TRANSFORMERS} />
            <MarkdownPastePlugin />
            <EquationPlugin />
            <WikiLinkPlugin />
            <YouTubePlugin />
            <ImagePlugin />
            <ImageGalleryPlugin />
            <ContextMenuPlugin />
            <OsWidgetPlugins />
          </div>
        </div>
      </Paper>

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

export default function LexicalEditor(props: LexicalEditorProps) {
  const theme = useTheme();

  // Validate and prepare initial editor state
  let initialEditorState: string | undefined = undefined;
  if (props.content) {
    try {
      const parsed = JSON.parse(props.content);
      // Only use content if it's valid Lexical format
      if (parsed.root) {
        initialEditorState = props.content;
      } else {
        console.warn('Invalid content format detected, starting with empty editor');
      }
    } catch (error) {
      console.error('Error parsing initial content:', error);
    }
  }

  // Initial config for the editor
  const initialConfig: any = {
    namespace: 'OpenSilicioEditor',
    theme: {
      // Theme styles (can be customized)
    },
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    nodes: LEXICAL_NODES,
  };

  if (initialEditorState !== undefined) {
    initialConfig.editorState = initialEditorState;
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <LexicalErrorBoundary>
        <LexicalEditorInner {...props} />
      </LexicalErrorBoundary>
    </LexicalComposer>
  );
}
