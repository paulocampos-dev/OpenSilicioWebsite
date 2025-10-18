import { useMemo } from 'react';
import { Box } from '@mui/material';
import { Block, BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import '@blocknote/mantine/style.css';

interface BlockNoteContentProps {
  content: string;
}

export default function BlockNoteContent({ content }: BlockNoteContentProps) {
  const blocks = useMemo(() => {
    if (!content) return [];
    try {
      return JSON.parse(content) as Block[];
    } catch {
      return [];
    }
  }, [content]);

  // Convert blocks to HTML for display
  const htmlContent = useMemo(() => {
    if (blocks.length === 0) {
      return '<p>Nenhum conteúdo disponível.</p>';
    }

    // Simple block to HTML conversion
    // BlockNote blocks have a type and content structure
    return blocks.map((block: any) => {
      const type = block.type;
      const content = block.content;

      // Extract text from content array
      const getText = (contentArray: any[] = []) => {
        if (!contentArray || contentArray.length === 0) return '';
        return contentArray
          .map((item: any) => {
            if (typeof item === 'string') return item;
            if (item.type === 'text') {
              let text = item.text || '';
              // Apply text styles
              if (item.styles?.bold) text = `<strong>${text}</strong>`;
              if (item.styles?.italic) text = `<em>${text}</em>`;
              if (item.styles?.underline) text = `<u>${text}</u>`;
              if (item.styles?.strike) text = `<s>${text}</s>`;
              if (item.styles?.code) text = `<code>${text}</code>`;
              return text;
            }
            if (item.type === 'link') {
              return `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${item.content?.[0]?.text || item.href}</a>`;
            }
            return '';
          })
          .join('');
      };

      const textContent = getText(content);

      switch (type) {
        case 'heading':
          const level = block.props?.level || 1;
          return `<h${level}>${textContent}</h${level}>`;

        case 'paragraph':
          return `<p>${textContent || '<br>'}</p>`;

        case 'bulletListItem':
          return `<li>${textContent}</li>`;

        case 'numberedListItem':
          return `<li>${textContent}</li>`;

        case 'image':
          const url = block.props?.url || '';
          const caption = block.props?.caption || '';
          return `<figure>
            <img src="${url}" alt="${caption}" style="max-width: 100%; height: auto; border-radius: 8px;" />
            ${caption ? `<figcaption style="text-align: center; color: #666; margin-top: 8px; font-size: 0.875rem;">${caption}</figcaption>` : ''}
          </figure>`;

        case 'codeBlock':
          const language = block.props?.language || '';
          return `<pre><code class="language-${language}">${textContent}</code></pre>`;

        case 'table':
          // Table rendering would need more complex logic
          return `<p>[Tabela]</p>`;

        default:
          return `<p>${textContent}</p>`;
      }
    }).join('');
  }, [blocks]);

  if (!content || blocks.length === 0) {
    return (
      <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
        Nenhum conteúdo disponível.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        '& h1': {
          fontSize: { xs: '2rem', md: '2.5rem' },
          fontWeight: 700,
          marginBottom: 2,
          marginTop: 3,
          lineHeight: 1.2,
        },
        '& h2': {
          fontSize: { xs: '1.5rem', md: '2rem' },
          fontWeight: 700,
          marginBottom: 2,
          marginTop: 3,
          lineHeight: 1.3,
        },
        '& h3': {
          fontSize: { xs: '1.25rem', md: '1.5rem' },
          fontWeight: 600,
          marginBottom: 1.5,
          marginTop: 2.5,
          lineHeight: 1.4,
        },
        '& p': {
          fontSize: '1.125rem',
          lineHeight: 1.8,
          marginBottom: 2,
          color: 'text.primary',
        },
        '& ul, & ol': {
          paddingLeft: 3,
          marginBottom: 2,
          '& li': {
            fontSize: '1.125rem',
            lineHeight: 1.8,
            marginBottom: 1,
          },
        },
        '& pre': {
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
          marginBottom: 2,
          '& code': {
            fontFamily: 'monospace',
            fontSize: '0.9rem',
          },
        },
        '& code': {
          backgroundColor: 'rgba(0,0,0,0.05)',
          padding: '2px 6px',
          borderRadius: 0.5,
          fontFamily: 'monospace',
          fontSize: '0.9em',
        },
        '& img': {
          maxWidth: '100%',
          height: 'auto',
          borderRadius: 2,
          marginBottom: 2,
        },
        '& figure': {
          margin: '2rem 0',
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
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
