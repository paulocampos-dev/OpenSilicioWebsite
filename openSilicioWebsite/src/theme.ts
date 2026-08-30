import { createTheme } from '@mui/material/styles'

export type ColorMode = 'light' | 'dark'

// Mirrors src/styles/design-system/tokens/colors.css ("Industry", branded
// steel-blue for OpenSilício). One accent only — no decorative color beyond
// it. Keep these two files in sync; see REDESIGN_IMPLEMENTATION_PLAN.md.
const steel = {
  100: '#eef6ff',
  300: '#b5d9fd',
  500: '#5980a6',
  600: '#4a6e91',
  700: '#416180',
  900: '#1d2d3d',
}
const paper = '#f2f2f3'
const fieldDeep = '#16222e'
const ink = '#1d1f20'

export const getTheme = (mode: ColorMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: steel[500],
        light: steel[300],
        dark: steel[700],
        contrastText: paper,
      },
      // The system is a mono scheme — no second accent. Secondary mirrors
      // primary so existing `color="secondary"` usages don't reintroduce
      // decorative color while pages are migrated page-by-page.
      secondary: {
        main: steel[500],
        light: steel[300],
        dark: steel[700],
        contrastText: paper,
      },
      background: {
        default: mode === 'light' ? paper : fieldDeep,
        paper: mode === 'light' ? paper : fieldDeep,
      },
      text: {
        // MUI's own color utilities (alpha(), darken()...) only parse
        // hex/rgb/hsl, not CSS color-mix() — these must stay plain rgba().
        primary: mode === 'light' ? ink : paper,
        secondary: mode === 'light' ? 'rgba(29, 31, 32, 0.70)' : 'rgba(242, 242, 243, 0.78)',
      },
      divider: mode === 'light' ? 'rgba(29, 31, 32, 0.16)' : 'rgba(242, 242, 243, 0.40)',
    },
    typography: {
      fontFamily: 'var(--font-body)',
      h1: { fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' },
      h2: { fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' },
      h3: { fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' },
      h4: { fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' },
      h5: { fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' },
      h6: { fontFamily: 'var(--font-heading)', fontWeight: 600, textTransform: 'uppercase' },
      button: { fontFamily: 'var(--font-body)', textTransform: 'none', fontWeight: 500 },
    },
    // Everything in this system is square — see patterns/blueprint.css.
    shape: { borderRadius: 0 },
  })
