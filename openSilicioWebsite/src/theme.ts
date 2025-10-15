import { createTheme } from '@mui/material/styles'

export type ColorMode = 'light' | 'dark'

export const getTheme = (mode: ColorMode) =>
  createTheme({
    palette: {
      mode,
      primary: {
        main: mode === 'light' ? '#1976d2' : '#90caf9', // Blue tones for technology
        light: mode === 'light' ? '#42a5f5' : '#e3f2fd',
        dark: mode === 'light' ? '#1565c0' : '#42a5f5',
      },
      secondary: {
        main: mode === 'light' ? '#9c27b0' : '#ba68c8', // Purple accent for electronics
        light: mode === 'light' ? '#ce93d8' : '#f3e5f5',
        dark: mode === 'light' ? '#7b1fa2' : '#ce93d8',
      },
      background: {
        default: mode === 'light' ? '#f5f7fa' : '#0f0f23', // Slightly blue-tinted backgrounds
        paper: mode === 'light' ? '#ffffff' : '#1a1a2e',
      },
      text: {
        primary: mode === 'light' ? '#1a1a2e' : '#e8eaf6',
        secondary: mode === 'light' ? '#5f6368' : '#b0bec5',
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, system-ui, Arial, sans-serif',
    },
    shape: { borderRadius: 10 },
  })


