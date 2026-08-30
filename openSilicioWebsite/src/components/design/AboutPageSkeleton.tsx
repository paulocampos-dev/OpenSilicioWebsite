import { Box, Card, CardContent, Grid, Skeleton, Stack } from '@mui/material'

/**
 * Loading placeholder for About.tsx, which still uses the old pre-redesign
 * MUI Card/Avatar look — plain rounded MUI Skeleton defaults on purpose,
 * to match what it's standing in for rather than the blueprint system.
 */
export default function AboutPageSkeleton() {
  return (
    <Stack spacing={8}>
      <Stack spacing={2} alignItems="center">
        <Skeleton variant="text" width={320} height={56} />
      </Stack>

      <Stack spacing={1.5}>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="text" width="80%" />
      </Stack>

      <Grid container spacing={6}>
        {[0, 1].map((i) => (
          <Grid key={i} size={{ xs: 12, md: 6 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 1 }} />
                <Skeleton variant="text" />
                <Skeleton variant="text" width="70%" />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4} justifyContent="center">
        {[0, 1, 2, 3].map((i) => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
            <Card sx={{ height: '100%', textAlign: 'center' }}>
              <CardContent>
                <Stack spacing={2} alignItems="center">
                  <Skeleton variant="circular" width={100} height={100} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" sx={{ mx: 'auto' }} />
                    <Skeleton variant="text" width="40%" sx={{ mx: 'auto' }} />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}
