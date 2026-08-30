import { Stack } from '@mui/material'

interface PagerProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function Pager({ page, totalPages, onChange }: PagerProps) {
  return (
    <Stack direction="row" spacing={1} justifyContent="center">
      <button type="button" className="btn btn-secondary" disabled={page === 1} onClick={() => onChange(page - 1)}>
        ←
      </button>
      {Array.from({ length: totalPages }).map((_, idx) => {
        const pageNumber = idx + 1
        return (
          <button
            key={pageNumber}
            type="button"
            className={pageNumber === page ? 'btn btn-primary' : 'btn btn-secondary'}
            onClick={() => onChange(pageNumber)}
          >
            {pageNumber}
          </button>
        )
      })}
      <button type="button" className="btn btn-secondary" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        →
      </button>
    </Stack>
  )
}
