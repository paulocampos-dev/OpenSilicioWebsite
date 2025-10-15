import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
  Box,
  Button,
  ButtonGroup,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
  IconButton,
  Tooltip,
} from '@mui/material';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import ImageIcon from '@mui/icons-material/Image';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import { uploadApi } from '../services/api';
import WikiLinkInserter from './WikiLinkInserter';

interface RichTextEditorProps {
  content: string;
  contentType: 'wysiwyg' | 'markdown';
  onContentChange: (content: string) => void;
  onContentTypeChange: (type: 'wysiwyg' | 'markdown') => void;
}

export default function RichTextEditor({
  content,
  contentType,
  onContentChange,
  onContentTypeChange,
}: RichTextEditorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [wikiLinkDialogOpen, setWikiLinkDialogOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: contentType === 'wysiwyg' ? content : '',
    onUpdate: ({ editor }) => {
      if (contentType === 'wysiwyg') {
        onContentChange(editor.getHTML());
      }
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const result = await uploadApi.uploadFile(file);
        if (contentType === 'wysiwyg' && editor) {
          editor.chain().focus().setImage({ src: result.url }).run();
        } else {
          onContentChange(content + `\n![Imagem](${result.url})\n`);
        }
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        alert('Erro ao fazer upload da imagem');
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const handleWikiLinkInsert = (term: string, slug: string) => {
    if (contentType === 'wysiwyg' && editor) {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to);
      const linkText = selectedText || term;
      
      editor.chain().focus().setLink({ 
        href: `/wiki/${slug}`,
        target: '_blank'
      }).run();
    } else {
      const wikiLink = `[${term}](/wiki/${slug})`;
      onContentChange(content + wikiLink);
    }
  };

  const getSelectedText = () => {
    if (contentType === 'wysiwyg' && editor) {
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to);
    }
    return '';
  };

  if (contentType === 'markdown') {
    return (
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <ToggleButtonGroup
            value={contentType}
            exclusive
            onChange={(_, value) => value && onContentTypeChange(value)}
            size="small"
          >
            <ToggleButton value="wysiwyg">WYSIWYG</ToggleButton>
            <ToggleButton value="markdown">Markdown</ToggleButton>
          </ToggleButtonGroup>
          <Button
            startIcon={<ImageIcon />}
            onClick={handleImageUpload}
            disabled={isUploading}
            size="small"
          >
            {isUploading ? 'Enviando...' : 'Adicionar Imagem'}
          </Button>
          <Button
            startIcon={<LinkIcon />}
            onClick={() => setWikiLinkDialogOpen(true)}
            size="small"
          >
            Link da Wiki
          </Button>
        </Box>
        <TextField
          multiline
          rows={20}
          fullWidth
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Digite seu conteúdo em Markdown..."
          sx={{ fontFamily: 'monospace' }}
        />
      </Stack>
    );
  }

  if (!editor) {
    return null;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <ToggleButtonGroup
          value={contentType}
          exclusive
          onChange={(_, value) => value && onContentTypeChange(value)}
          size="small"
        >
          <ToggleButton value="wysiwyg">WYSIWYG</ToggleButton>
          <ToggleButton value="markdown">Markdown</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <Paper variant="outlined" sx={{ p: 1 }}>
        <ButtonGroup size="small" sx={{ mb: 1 }}>
          <Tooltip title="Negrito">
            <IconButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              color={editor.isActive('bold') ? 'primary' : 'default'}
            >
              <FormatBoldIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Itálico">
            <IconButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              color={editor.isActive('italic') ? 'primary' : 'default'}
            >
              <FormatItalicIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lista com marcadores">
            <IconButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              color={editor.isActive('bulletList') ? 'primary' : 'default'}
            >
              <FormatListBulletedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Lista numerada">
            <IconButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              color={editor.isActive('orderedList') ? 'primary' : 'default'}
            >
              <FormatListNumberedIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Código">
            <IconButton
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              color={editor.isActive('codeBlock') ? 'primary' : 'default'}
            >
              <CodeIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Adicionar Imagem">
            <IconButton onClick={handleImageUpload} disabled={isUploading}>
              <ImageIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Adicionar Link da Wiki">
            <IconButton onClick={() => setWikiLinkDialogOpen(true)}>
              <LinkIcon />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        <Box
          sx={{
            '& .ProseMirror': {
              minHeight: 300,
              padding: 2,
              outline: 'none',
              '& h1': { fontSize: '2em', fontWeight: 700, marginBottom: 1 },
              '& h2': { fontSize: '1.5em', fontWeight: 700, marginBottom: 1 },
              '& p': { marginBottom: 1 },
              '& ul, & ol': { paddingLeft: 3, marginBottom: 1 },
              '& pre': {
                backgroundColor: 'rgba(0,0,0,0.05)',
                padding: 1,
                borderRadius: 1,
                fontFamily: 'monospace',
              },
              '& img': { maxWidth: '100%', height: 'auto' },
            },
          }}
        >
          <EditorContent editor={editor} />
        </Box>
      </Paper>

      <WikiLinkInserter
        open={wikiLinkDialogOpen}
        onClose={() => setWikiLinkDialogOpen(false)}
        onInsert={handleWikiLinkInsert}
        selectedText={getSelectedText()}
      />
    </Stack>
  );
}

