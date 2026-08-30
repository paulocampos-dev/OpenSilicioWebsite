/**
 * Aspect-ratio-preserving width/height for an east-edge drag resize.
 * Returns null when the drag would shrink the image to 50px or less (reject, don't apply).
 */
export function computeResizedDimensions({
  startWidth,
  ratio,
  startX,
  clientX,
}: {
  startWidth: number
  ratio: number
  startX: number
  clientX: number
}): { width: number; height: number } | null {
  const diff = -Math.floor(startX - clientX)
  const width = startWidth + diff
  if (width <= 50) return null

  return { width, height: width / ratio }
}
