import { Skeleton, type SkeletonProps } from '@mui/material'

/**
 * MUI Skeleton with this design system's square corners baked in — use this
 * instead of importing Skeleton directly anywhere a loading placeholder
 * should sit inside a .blueprint frame or otherwise match the hairline aesthetic.
 */
export default function SkeletonBlock({ sx, ...props }: SkeletonProps) {
  return <Skeleton sx={{ borderRadius: 0, ...sx }} {...props} />
}
