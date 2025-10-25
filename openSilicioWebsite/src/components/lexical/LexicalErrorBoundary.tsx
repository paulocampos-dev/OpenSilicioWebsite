import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class LexicalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lexical Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Paper
          variant="outlined"
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: 'error.light',
            color: 'error.contrastText',
          }}
        >
          <ErrorOutlineIcon sx={{ fontSize: 48, mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Erro no Editor
          </Typography>
          <Typography variant="body2" sx={{ mb: 3 }}>
            Ocorreu um erro ao carregar o editor. Por favor, tente recarregar a página.
          </Typography>
          {this.state.error && (
            <Typography
              variant="caption"
              component="pre"
              sx={{
                backgroundColor: 'rgba(0,0,0,0.1)',
                p: 2,
                borderRadius: 1,
                textAlign: 'left',
                overflow: 'auto',
                mb: 2,
              }}
            >
              {this.state.error.toString()}
            </Typography>
          )}
          <Button variant="contained" onClick={this.handleReset}>
            Recarregar Página
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}
