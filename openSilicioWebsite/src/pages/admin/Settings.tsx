import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { settingsApi, educationApi, blogApi } from '../../services/api';
import type { SiteSettings, EducationResource, BlogPost } from '../../types';

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings>({
    contact_email: '',
    instagram_url: '',
    linkedin_url: '',
    address: '',
    featured_education_ids: [],
    featured_blog_ids: [],
  });
  const [availableEducation, setAvailableEducation] = useState<EducationResource[]>([]);
  const [availableBlogs, setAvailableBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch settings
      const settingsData = await settingsApi.getAll();
      setSettings(settingsData);

      // Fetch available education resources (published only)
      const educationData = await educationApi.getAll(true, 1, 100);
      setAvailableEducation(educationData.data);

      // Fetch available blog posts (published only)
      const blogData = await blogApi.getAll(true, 1, 100);
      setAvailableBlogs(blogData.data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const updated = await settingsApi.update(settings);
      setSettings(updated);
      setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Typography>Carregando configurações...</Typography>
    );
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Configurações do Site
        </Typography>
        <Typography color="text.secondary">
          Gerencie as informações de contato, redes sociais e conteúdo em destaque
        </Typography>
      </Box>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Contact Information */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Informações de Contato
          </Typography>
          <Stack spacing={3}>
            <TextField
              label="Email de Contato"
              value={settings.contact_email}
              onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
              fullWidth
              type="email"
            />
            <TextField
              label="Instagram URL"
              value={settings.instagram_url}
              onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
              fullWidth
              placeholder="https://www.instagram.com/opensilicio/"
            />
            <TextField
              label="LinkedIn URL"
              value={settings.linkedin_url}
              onChange={(e) => setSettings({ ...settings, linkedin_url: e.target.value })}
              fullWidth
              placeholder="https://www.linkedin.com/company/opensilicio/"
            />
            <TextField
              label="Endereço"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              fullWidth
              multiline
              rows={3}
              placeholder="Escola Politécnica Prédio da Engenharia Elétrica, Av. Prof. Luciano Gualberto, trav. 3, 158, São Paulo - SP, 05508-010"
            />
          </Stack>
        </CardContent>
      </Card>

      {/* Featured Education Resources */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Recursos Educacionais em Destaque (Máximo 3)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecione até 3 recursos educacionais para exibir na seção "Aprenda com Nossos Projetos" da página inicial
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Recursos Educacionais</InputLabel>
            <Select
              multiple
              value={settings.featured_education_ids}
              onChange={(e) => {
                const value = e.target.value as string[];
                if (value.length <= 3) {
                  setSettings({ ...settings, featured_education_ids: value });
                } else {
                  setMessage({ type: 'error', text: 'Máximo de 3 recursos permitidos' });
                }
              }}
              input={<OutlinedInput label="Recursos Educacionais" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const resource = availableEducation.find((r) => r.id === id);
                    return <Chip key={id} label={resource?.title || id} size="small" />;
                  })}
                </Box>
              )}
            >
              {availableEducation.map((resource) => (
                <MenuItem key={resource.id} value={resource.id}>
                  {resource.title}
                </MenuItem>
              ))}
              {availableEducation.length === 0 && (
                <MenuItem disabled>Nenhum recurso publicado disponível</MenuItem>
              )}
            </Select>
          </FormControl>

          {settings.featured_education_resources && settings.featured_education_resources.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pré-visualização:
              </Typography>
              <Stack spacing={1}>
                {settings.featured_education_resources.map((resource) => (
                  <Card key={resource.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {resource.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {resource.description}
                      </Typography>
                      {resource.category && (
                        <Chip label={resource.category} size="small" sx={{ mt: 1 }} />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Featured Blog Posts */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Posts do Blog em Destaque (Máximo 3)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Selecione até 3 posts do blog para exibir na seção de destaque da página inicial
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Posts do Blog</InputLabel>
            <Select
              multiple
              value={settings.featured_blog_ids}
              onChange={(e) => {
                const value = e.target.value as string[];
                if (value.length <= 3) {
                  setSettings({ ...settings, featured_blog_ids: value });
                } else {
                  setMessage({ type: 'error', text: 'Máximo de 3 posts permitidos' });
                }
              }}
              input={<OutlinedInput label="Posts do Blog" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const post = availableBlogs.find((p) => p.id === id);
                    return <Chip key={id} label={post?.title || id} size="small" />;
                  })}
                </Box>
              )}
            >
              {availableBlogs.map((post) => (
                <MenuItem key={post.id} value={post.id}>
                  {post.title}
                </MenuItem>
              ))}
              {availableBlogs.length === 0 && (
                <MenuItem disabled>Nenhum post publicado disponível</MenuItem>
              )}
            </Select>
          </FormControl>

          {settings.featured_blog_posts && settings.featured_blog_posts.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Pré-visualização:
              </Typography>
              <Stack spacing={1}>
                {settings.featured_blog_posts.map((post) => (
                  <Card key={post.id} variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {post.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {post.excerpt}
                      </Typography>
                      <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        {post.category && <Chip label={post.category} size="small" />}
                        {post.author && <Chip label={`Por ${post.author}`} size="small" variant="outlined" />}
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          size="large"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </Button>
      </Box>
    </Stack>
  );
}
