import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePagedFilter } from './usePagedFilter'

type FilterFnProps = { filterFn: (n: number) => boolean }

const items = Array.from({ length: 10 }, (_, i) => i + 1)

describe('usePagedFilter', () => {
  it('slices the filtered items into the current page', () => {
    const { result } = renderHook(() =>
      usePagedFilter(items, { pageSize: 4, filterFn: () => true, deps: [] })
    )
    expect(result.current.pageItems).toEqual([1, 2, 3, 4])
    expect(result.current.totalPages).toBe(3)
    expect(result.current.filteredCount).toBe(10)
  })

  it('applies filterFn before paginating', () => {
    const { result } = renderHook(() =>
      usePagedFilter(items, { pageSize: 4, filterFn: (n) => n % 2 === 0, deps: [] })
    )
    expect(result.current.filteredCount).toBe(5)
    expect(result.current.pageItems).toEqual([2, 4, 6, 8])
  })

  it('clamps the requested page into [1, totalPages]', () => {
    const { result } = renderHook(() =>
      usePagedFilter(items, { pageSize: 4, filterFn: () => true, deps: [] })
    )
    act(() => result.current.setPage(99))
    expect(result.current.page).toBe(3)
    act(() => result.current.setPage(-5))
    expect(result.current.page).toBe(1)
  })

  it('clamps the current page down when the filtered set shrinks', () => {
    const { result, rerender } = renderHook<ReturnType<typeof usePagedFilter<number>>, FilterFnProps>(
      ({ filterFn }) => usePagedFilter(items, { pageSize: 4, filterFn, deps: [] }),
      { initialProps: { filterFn: () => true } }
    )
    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)

    rerender({ filterFn: (n: number) => n <= 2 })
    expect(result.current.totalPages).toBe(1)
    expect(result.current.page).toBe(1)
  })

  it('resets to page 1 when a listed dep changes', () => {
    const { result, rerender } = renderHook(
      ({ dep }: { dep: string }) => usePagedFilter(items, { pageSize: 4, filterFn: () => true, deps: [dep] }),
      { initialProps: { dep: 'a' } }
    )
    act(() => result.current.setPage(3))
    expect(result.current.page).toBe(3)

    rerender({ dep: 'b' })
    expect(result.current.page).toBe(1)
  })
})
