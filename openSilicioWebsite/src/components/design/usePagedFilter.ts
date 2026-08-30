import { useEffect, useMemo, useState } from 'react'

interface UsePagedFilterOptions<T> {
  pageSize: number
  filterFn: (item: T) => boolean
  /** Reset to page 1 whenever any of these change, e.g. the search/category state driving filterFn. */
  deps: readonly unknown[]
}

interface UsePagedFilterResult<T> {
  pageItems: T[]
  filteredCount: number
  page: number
  totalPages: number
  setPage: (page: number) => void
}

export function usePagedFilter<T>(
  items: T[],
  { pageSize, filterFn, deps }: UsePagedFilterOptions<T>
): UsePagedFilterResult<T> {
  const [page, setPageState] = useState(1)

  const filtered = useMemo(() => items.filter(filterFn), [items, filterFn])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const clampedPage = Math.min(Math.max(1, page), totalPages)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPageState(1), deps)

  const pageItems = useMemo(() => {
    const start = (clampedPage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, clampedPage, pageSize])

  const setPage = (next: number) => setPageState(Math.min(Math.max(1, next), totalPages))

  return { pageItems, filteredCount: filtered.length, page: clampedPage, totalPages, setPage }
}
