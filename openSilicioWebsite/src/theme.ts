import { createTheme } from '@mui/material/styles'

export type ColorMode = 'light' | 'dark'

export const getTheme = (mode: ColorMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#00C853' : '#69F0AE',
      },
      secondary: {
        main: mode === 'light' ? '#1b5e20' : '#A5D6A7',
      },
      background: {
        default: mode === 'light' ? '#fafafa' : '#121212',
        paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, system-ui, Arial, sans-serif',
    },
    shape: { borderRadius: 10 },
  })


