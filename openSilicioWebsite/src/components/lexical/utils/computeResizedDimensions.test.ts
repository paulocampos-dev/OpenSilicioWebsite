import { describe, it, expect } from 'vitest'
import { computeResizedDimensions } from './computeResizedDimensions'

describe('computeResizedDimensions', () => {
  it('grows width when dragging right, preserving aspect ratio', () => {
    const result = computeResizedDimensions({ startWidth: 200, ratio: 2, startX: 100, clientX: 150 })
    expect(result).toEqual({ width: 250, height: 125 })
  })

  it('shrinks width when dragging left', () => {
    const result = computeResizedDimensions({ startWidth: 200, ratio: 2, startX: 100, clientX: 60 })
    expect(result).toEqual({ width: 160, height: 80 })
  })

  it('returns null when the resulting width would be 50 or less', () => {
    expect(computeResizedDimensions({ startWidth: 60, ratio: 2, startX: 100, clientX: 40 })).toBeNull()
    expect(computeResizedDimensions({ startWidth: 60, ratio: 2, startX: 100, clientX: 50 })).toBeNull()
  })

  it('returns a size just above the 50px floor', () => {
    const result = computeResizedDimensions({ startWidth: 100, ratio: 2, startX: 100, clientX: 51 })
    expect(result).toEqual({ width: 51, height: 25.5 })
  })
})
