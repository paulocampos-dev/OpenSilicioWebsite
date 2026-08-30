import { Box, Grid, Stack } from '@mui/material'
import type { GridSize } from '@mui/material/Grid'
import BlueprintFrame from './BlueprintFrame'
import SkeletonBlock from './SkeletonBlock'

interface CardGridSkeletonProps {
  count?: number
  columns?: { xs?: GridSize; sm?: GridSize; md?: GridSize; lg?: GridSize }
  spacing?: number
  /** Set false for card grids with no thumbnail (e.g. the wiki term list). */
  withPhoto?: boolean
  photoAspectRatio?: string
}

/**
 * Placeholder for a loading .card/.blueprint grid — Educação, Blog, and
 * WikiList all share this shape, just with/without a photo. Corner marks
 * and the hairline border render immediately so the page reads as "cards
 * are about to appear" rather than a generic loading bar.
 */
export default function CardGridSkeleton({
  count = 6,
  columns = { xs: 12, md: 6, lg: 4 },
  spacing = 4,
  withPhoto = true,
  photoAspectRatio = '16 / 9',
}: CardGridSkeletonProps) {
  return (
    <Grid container spacing={spacing}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid key={i} size={columns}>
          <BlueprintFrame sx={{ display: 'flex', flexDirection: 'column' }}>
            {withPhoto && <SkeletonBlock variant="rectangular" sx={{ aspectRatio: photoAspectRatio, borderBottom: '1px solid var(--color-line)' }} />}
            <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <SkeletonBlock variant="rectangular" width={88} height={24} />
              <SkeletonBlock variant="text" sx={{ fontSize: '24px' }} width="70%" />
              <Stack spacing={0.5}>
                <SkeletonBlock variant="text" sx={{ fontSize: '15px' }} />
                <SkeletonBlock variant="text" sx={{ fontSize: '15px' }} width="85%" />
              </Stack>
            </Box>
          </BlueprintFrame>
        </Grid>
      ))}
    </Grid>
  )
}
