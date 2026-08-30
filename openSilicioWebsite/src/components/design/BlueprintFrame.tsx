import { Box, type BoxProps } from '@mui/material'

interface BlueprintFrameProps extends BoxProps {
  /** Also wash the frame's contents into the steel accent (for photos). */
  duotone?: boolean
  /** Keep the corner registration marks but drop the hairline border —
   * used for standalone photos, which already have their own edge. */
  frameless?: boolean
}

/**
 * The system's one structural motif: a hairline rectangle with four
 * registration crosses hanging outside its corners. Wrap any card, figure
 * or panel in this instead of hand-writing the four `<i class="corner">`
 * marks — see patterns/blueprint.css for the actual styling.
 */
export default function BlueprintFrame({ duotone, frameless, className, children, sx, ...props }: BlueprintFrameProps) {
  const classes = ['blueprint', duotone ? 'duotone' : '', className].filter(Boolean).join(' ')
  return (
    <Box
      className={classes}
      sx={frameless ? { borderColor: 'transparent', ...sx } : sx}
      {...props}
    >

      <i className="corner tl" />
      <i className="corner tr" />
      <i className="corner bl" />
      <i className="corner br" />
      {children}
    </Box>
  )
}
