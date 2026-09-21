import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MenuItem } from '@mui/material'
import { describe, expect, it } from 'vitest'
import AdminMobileItem from './AdminMobileItem'

describe('AdminMobileItem', () => {
  it('nomeia o botão com o registro e revela as ações recebidas', async () => {
    const user = userEvent.setup()
    render(
      <AdminMobileItem
        title="Projeto Digital"
        details={<span>6 módulos</span>}
        status={<span>Publicado</span>}
        actions={<MenuItem>Editar</MenuItem>}
      />,
    )

    expect(screen.getByText('6 módulos')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Ações de Projeto Digital' }))
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeVisible()
  })
})
