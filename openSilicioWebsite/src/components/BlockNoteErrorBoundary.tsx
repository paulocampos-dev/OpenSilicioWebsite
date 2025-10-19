import { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component specifically for BlockNote editor/viewer
 * Prevents crashes from propagating and provides a user-friendly error UI
 */
export default class BlockNoteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('BlockNote Error Boundary caught an error:', error, errorInfo);
    
    // In production, you could send this to an error reporting service
    if (import.meta.env.PROD) {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            borderColor: 'error.main',
            bgcolor: 'error.lighter',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: 'error.main' }} />
            <Typography variant="h6" fontWeight={600} color="error.main">
              Erro ao carregar o conteúdo
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 500 }}>
              Ocorreu um erro ao renderizar o editor de conteúdo. Isso pode acontecer se o
              conteúdo estiver corrompido ou em um formato incompatível.
            </Typography>
            {import.meta.env.DEV && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  textAlign: 'left',
                  maxWidth: '100%',
                  overflow: 'auto',
                }}
              >
                <Typography variant="caption" fontFamily="monospace" color="error">
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
              sx={{ mt: 1 }}
            >
              Tentar Novamente
            </Button>
          </Box>
        </Paper>
      );
    }

    return this.props.children;
  }
}

