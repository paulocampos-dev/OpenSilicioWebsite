import { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Link as MUILink, Tooltip } from '@mui/material';

interface WikiLinkRendererProps {
  children: ReactNode;
  href?: string;
  target?: string;
}

export default function WikiLinkRenderer({ children, href, target }: WikiLinkRendererProps) {
  // Check if this is a wiki link
  if (href?.startsWith('/wiki/')) {
    const slug = href.replace('/wiki/', '');
    
    return (
      <Tooltip title="Ver definição na Wiki" arrow>
        <MUILink
          component={RouterLink}
          to={href}
          sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            textDecorationColor: 'primary.light',
            '&:hover': {
              textDecorationColor: 'primary.main',
            },
          }}
        >
          {children}
        </MUILink>
      </Tooltip>
    );
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
