import { Stack } from '@mui/material'
import SkeletonBlock from './SkeletonBlock'

interface DetailPageSkeletonProps {
  withHeroImage?: boolean
}

/**
 * Single-column placeholder for Post/Recurso/WikiDetail while their data is
 * in flight. Deliberately never fakes a sidebar or tab bar — whether those
 * exist is only known once the real content arrives.
 */
export default function DetailPageSkeleton({ withHeroImage = true }: DetailPageSkeletonProps) {
  return (
    <Stack spacing={4}>
      <SkeletonBlock variant="text" width="40%" sx={{ fontSize: 13 }} />
      <Stack spacing={2}>
        <SkeletonBlock variant="rectangular" width={100} height={26} />
        <SkeletonBlock variant="text" width="80%" sx={{ fontSize: '48px' }} />
        <SkeletonBlock variant="text" width="30%" sx={{ fontSize: 15 }} />
        {withHeroImage && <SkeletonBlock variant="rectangular" sx={{ aspectRatio: '21 / 9', mt: 2 }} />}
        <Stack spacing={1} sx={{ mt: 2 }}>
          <SkeletonBlock variant="text" />
          <SkeletonBlock variant="text" />
          <SkeletonBlock variant="text" width="90%" />
          <SkeletonBlock variant="text" width="95%" />
          <SkeletonBlock variant="text" width="70%" />
          <SkeletonBlock variant="text" width="85%" />
        </Stack>
      </Stack>
    </Stack>
  )
}
