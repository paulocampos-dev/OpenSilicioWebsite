import { ReactNode, useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MUILink, Tooltip, Box } from '@mui/material';
import { wikiApi } from '../services/api';

interface WikiLinkRendererProps {
  children: ReactNode;
  href?: string;
  target?: string;
}

export default function WikiLinkRenderer({ children, href, target }: WikiLinkRendererProps) {
  const [exists, setExists] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if this is a wiki link
  const isWikiLink = href?.startsWith('/wiki/');
  const slug = isWikiLink ? href.replace('/wiki/', '') : '';

  useEffect(() => {
    if (isWikiLink && slug) {
      checkWikiExists(slug);
    }
  }, [isWikiLink, slug]);

  const checkWikiExists = async (slug: string) => {
    setLoading(true);
    try {
      await wikiApi.getBySlug(slug);
      setExists(true);
    } catch (error: any) {
      // 404 means the entry doesn't exist (pending link)
      if (error.response?.status === 404) {
        setExists(false);
      } else {
        // Other errors, assume it exists to avoid broken UX
        setExists(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isWikiLink) {
    // Pending wiki link (doesn't exist yet)
    if (exists === false) {
      return (
        <Tooltip
          title="Esta entrada da wiki ainda não foi criada"
          arrow
          placement="top"
        >
          <Box
            component="span"
            sx={{
              color: 'text.secondary',
              textDecoration: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationColor: 'text.disabled',
              cursor: 'help',
              position: 'relative',
              '&:hover': {
                color: 'text.primary',
                textDecorationColor: 'text.secondary',
              },
            }}
          >
            {children}
          </Box>
        </Tooltip>
      );
    }

    // Existing wiki link
    if (exists === true) {
      return (
        <Tooltip title="Ver definição na Wiki" arrow placement="top">
          <MUILink
            component={RouterLink}
            to={href}
            sx={{
              color: 'primary.main',
              textDecoration: 'underline',
              textDecorationColor: 'primary.light',
              fontWeight: 500,
              '&:hover': {
                textDecorationColor: 'primary.main',
                color: 'primary.dark',
              },
            }}
          >
            {children}
          </MUILink>
        </Tooltip>
      );
    }

    // Loading state - show as normal text
    return <span>{children}</span>;
  }

  // Regular external link
  return (
    <MUILink
      href={href}
      target={target || '_blank'}
      rel="noopener noreferrer"
      sx={{
        color: 'primary.main',
        textDecoration: 'underline',
        '&:hover': {
          textDecoration: 'none',
        },
      }}
    >
      {children}
    </MUILink>
  );
}
