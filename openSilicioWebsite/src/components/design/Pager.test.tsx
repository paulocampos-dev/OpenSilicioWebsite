import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pager from './Pager'

describe('Pager', () => {
  it('disables prev on the first page and next on the last page', () => {
    render(<Pager page={1} totalPages={3} onChange={vi.fn()} />)
    expect(screen.getByText('←')).toBeDisabled()
    expect(screen.getByText('→')).not.toBeDisabled()
  })

  it('calls onChange with the clicked page number', async () => {
    const onChange = vi.fn()
    render(<Pager page={1} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByText('2'))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('calls onChange with page + 1 / page - 1 for the arrows', async () => {
    const onChange = vi.fn()
    render(<Pager page={2} totalPages={3} onChange={onChange} />)
    await userEvent.click(screen.getByText('←'))
    expect(onChange).toHaveBeenCalledWith(1)
    await userEvent.click(screen.getByText('→'))
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
