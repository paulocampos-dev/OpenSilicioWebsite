import { useState, type MouseEvent, type ReactNode } from 'react'
import { Box, IconButton, Menu, Paper, Stack, Typography } from '@mui/material'
import MoreVertIcon from '@mui/icons-material/MoreVert'

interface AdminMobileItemProps {
  title: string
  details: ReactNode
  status?: ReactNode
  actions: ReactNode
}

/** Compact record row used by admin lists below the desktop breakpoint. */
export default function AdminMobileItem({ title, details, status, actions }: AdminMobileItemProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const menuId = `acoes-${title.toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, '-')}`

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => setAnchor(event.currentTarget)
  const closeMenu = () => setAnchor(null)

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 0 }}>
      <Stack direction="row" spacing={1.5} alignItems="flex-start">
        <Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
          <Typography sx={{ fontWeight: 700 }}>{title}</Typography>
          <Box sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5 }}>{details}</Box>
          {status && <Box sx={{ mt: 1 }}>{status}</Box>}
        </Box>
        <IconButton
          aria-label={`Ações de ${title}`}
          aria-controls={anchor ? menuId : undefined}
          aria-expanded={anchor ? 'true' : undefined}
          aria-haspopup="menu"
          onClick={openMenu}
          sx={{ width: 48, height: 48, flex: '0 0 auto' }}
        >
          <MoreVertIcon />
        </IconButton>
      </Stack>
      <Menu id={menuId} anchorEl={anchor} open={Boolean(anchor)} onClose={closeMenu} onClick={closeMenu}>
        {actions}
      </Menu>
    </Paper>
  )
}
