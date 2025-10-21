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
  Tabs,
  Tab,
  Alert,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import BookmarkAddIcon from '@mui/icons-material/BookmarkAdd';
import LinkIcon from '@mui/icons-material/Link';
import { wikiApi } from '../services/api';
import type { WikiEntry } from '../types';

interface WikiLinkInserterProps {
  open: boolean;
  onClose: () => void;
  onInsert: (term: string, slug: string) => void;
  onMarkPending?: (term: string) => void;
  selectedText: string;
  contentType?: 'blog' | 'education';
  contentId?: string;
}

export default function WikiLinkInserter({
  open,
  onClose,
  onInsert,
  onMarkPending,
  selectedText,
  contentType,
  contentId,
}: WikiLinkInserterProps) {
  const [entries, setEntries] = useState<WikiEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState<'existing' | 'pending'>('existing');
  const [pendingTerm, setPendingTerm] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      loadEntries();
      setPendingTerm(selectedText || '');
      setSearchQuery('');
      setTab('existing');
    }
  }, [open, selectedText]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const data = await wikiApi.getAll(true); // Only published entries
      setEntries(data.data || []);
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
      entry.definition.toLowerCase().includes(query) ||
      (entry.aliases && entry.aliases.some(alias => alias.toLowerCase().includes(query)))
    );
  });

  const handleSelect = (entry: WikiEntry) => {
    onInsert(entry.term, entry.slug);
    onClose();
  };

  const handleMarkPending = async () => {
    if (!pendingTerm.trim()) return;

    if (onMarkPending) {
      // Simple callback mode
      onMarkPending(pendingTerm.trim());
      onClose();
    } else if (contentType && contentId) {
      // Create pending link via API
      setCreating(true);
      try {
        await wikiApi.createPendingLink({
          term: pendingTerm.trim(),
          contentType,
          contentId,
          context: selectedText,
        });
        onInsert(pendingTerm.trim(), `pending-${pendingTerm.trim().toLowerCase().replace(/\s+/g, '-')}`);
        onClose();
      } catch (error: any) {
        console.error('Erro ao criar link pendente:', error);
        alert(error.response?.data?.message || 'Erro ao criar link pendente');
      } finally {
        setCreating(false);
      }
    }
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
        <Tabs
          value={tab}
          onChange={(_, newValue) => setTab(newValue)}
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<LinkIcon />}
            iconPosition="start"
            label="Vincular a entrada existente"
            value="existing"
          />
          <Tab
            icon={<BookmarkAddIcon />}
            iconPosition="start"
            label="Marcar para criar depois"
            value="pending"
          />
        </Tabs>

        {tab === 'existing' && (
          <Box>
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
                          primary={
                            <Box>
                              <Typography fontWeight={600}>
                                {entry.term}
                              </Typography>
                              {entry.aliases && entry.aliases.length > 0 && (
                                <Typography variant="caption" color="text.secondary">
                                  Aliases: {entry.aliases.join(', ')}
                                </Typography>
                              )}
                            </Box>
                          }
                          secondary={entry.definition}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))
                )}
              </List>
            )}
          </Box>
        )}

        {tab === 'pending' && (
          <Box>
            {!contentType || !contentId ? (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Para marcar links pendentes, você precisa salvar este conteúdo primeiro.
                Por enquanto, você pode apenas vincular a entradas existentes da wiki.
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ mb: 3 }}>
                  Marque este termo como link da wiki e crie a entrada completa mais tarde.
                  O texto será exibido com um sublinhado pontilhado até que a entrada seja criada.
                </Alert>

                <TextField
                  fullWidth
                  label="Termo da Wiki"
                  value={pendingTerm}
                  onChange={(e) => setPendingTerm(e.target.value)}
                  placeholder="Digite o termo que será uma entrada da wiki..."
                  helperText="Este termo poderá ser transformado em uma entrada da wiki posteriormente"
                  sx={{ mb: 2 }}
                />

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary">
                  Depois de marcar, você poderá criar a entrada completa através do painel de administração,
                  na seção "Wiki &gt; Links Pendentes".
                </Typography>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        {tab === 'pending' && contentType && contentId && (
          <Button
            variant="contained"
            onClick={handleMarkPending}
            disabled={!pendingTerm.trim() || creating}
            startIcon={<BookmarkAddIcon />}
          >
            {creating ? 'Marcando...' : 'Marcar para Depois'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
