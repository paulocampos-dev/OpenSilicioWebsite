import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { wikiApi } from '../services/api';
import type { WikiEntry } from '../types';

interface WikiLinkInserterProps {
  open: boolean;
  onClose: () => void;
  onInsert: (term: string, slug: string) => void;
  selectedText: string;
}

export default function WikiLinkInserter({
  open,
  onClose,
  onInsert,
  selectedText,
}: WikiLinkInserterProps) {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (open) {
      loadEntries();
    }
  }, [open]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await wikiApi.getAll(true); // Only published entries
      setEntries(data);
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

  const handleSelect = (entry: WikiEntry) => {
    onInsert(entry.term, entry.slug);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Typography variant="h6" fontWeight={700}>
          Adicionar Link da Wiki
        </Typography>
        {selectedText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Texto selecionado: "{selectedText}"
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Buscar termos da wiki..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Carregando entradas...</Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {filteredEntries.length === 0 ? (
              <ListItem>
                <Typography color="text.secondary">
                  Nenhuma entrada encontrada
                </Typography>
              </ListItem>
            ) : (
              filteredEntries.map((entry) => (
                <ListItem key={entry.id} disablePadding>
                  <ListItemButton onClick={() => handleSelect(entry)}>
                    <ListItemText
                      primary={entry.term}
                      secondary={entry.definition}
                      primaryTypographyProps={{ fontWeight: 600 }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            )}
          </List>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}
