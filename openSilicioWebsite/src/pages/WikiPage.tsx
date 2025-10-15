import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { wikiApi } from '../services/api';
import type { WikiEntry } from '../types';

export default function WikiList() {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      // Load all published entries with high limit for client-side filtering
      const response = await wikiApi.getAll(true, 1, 100);
      setEntries(response.data);
    } catch (error) {
      console.error('Erro ao carregar entradas da wiki:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      entry.term.toLowerCase().includes(query) ||
      entry.definition.toLowerCase().includes(query)
    );
  });

  return (
    <Stack spacing={6}>
      {/* Hero */}
      <Stack spacing={1} alignItems="center" textAlign="center">
        <Typography sx={{ typography: { xs: 'h4', sm: 'h3' } }} fontWeight={800}>
          Wiki do OpenSilício
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
          Dicionário de termos técnicos e conceitos relacionados à eletrônica e projeto de circuitos integrados.
        </Typography>
      </Stack>

      {/* Search */}
      <TextField
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Buscar termos..."
        sx={{ maxWidth: 600, mx: 'auto', width: '100%' }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      {/* Entries Grid */}
      <Grid container spacing={3}>
        {loading ? (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>Carregando entradas...</Typography>
            </Box>
          </Grid>
        ) : filteredEntries.length === 0 ? (
          <Grid size={12}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography>
                {searchQuery ? 'Nenhuma entrada encontrada para sua busca.' : 'Nenhuma entrada da wiki encontrada.'}
              </Typography>
            </Box>
          </Grid>
        ) : (
          filteredEntries.map((entry) => (
            <Grid key={entry.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardActionArea component={RouterLink} to={`/wiki/${entry.slug}`}>
                  <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="h6" fontWeight={700} color="primary">
                      {entry.term}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {entry.definition}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                      Clique para ver mais detalhes →
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Stack>
  );
}
