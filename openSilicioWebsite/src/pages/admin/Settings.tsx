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
  IconButton,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { settingsApi } from '../../services/api';
import type { SiteSettings, FeaturedProject } from '../../types';

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings>({
    contact_email: '',
    instagram_url: '',
    linkedin_url: '',
    address: '',
    featured_projects: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
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

  const addProject = () => {
    if (settings.featured_projects.length >= 3) {
      setMessage({ type: 'error', text: 'Máximo de 3 projetos em destaque permitidos' });
      return;
    }

    setSettings({
      ...settings,
      featured_projects: [
        ...settings.featured_projects,
        {
          image: '',
          title: '',
          description: '',
          badge: '',
          gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        },
      ],
    });
  };

  const removeProject = (index: number) => {
    const newProjects = settings.featured_projects.filter((_, i) => i !== index);
    setSettings({ ...settings, featured_projects: newProjects });
  };

  const updateProject = (index: number, field: keyof FeaturedProject, value: string) => {
    const newProjects = [...settings.featured_projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setSettings({ ...settings, featured_projects: newProjects });
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
          Gerencie as informações de contato, redes sociais e projetos em destaque
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

      {/* Featured Projects */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              Projetos em Destaque (Máximo 3)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addProject}
              disabled={settings.featured_projects.length >= 3}
            >
              Adicionar Projeto
            </Button>
          </Box>

          {settings.featured_projects.length === 0 && (
            <Typography color="text.secondary" textAlign="center" py={4}>
              Nenhum projeto em destaque. Adicione até 3 projetos para exibir na página inicial.
            </Typography>
          )}

          <Stack spacing={3}>
            {settings.featured_projects.map((project, index) => (
              <Card key={index} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Projeto {index + 1}
                    </Typography>
                    <IconButton onClick={() => removeProject(index)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Stack spacing={2}>
                    <TextField
                      label="URL da Imagem"
                      value={project.image}
                      onChange={(e) => updateProject(index, 'image', e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="/chip_closeup_stock.jpg"
                    />
                    <TextField
                      label="Título"
                      value={project.title}
                      onChange={(e) => updateProject(index, 'title', e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="Física de Semicondutores"
                    />
                    <TextField
                      label="Descrição"
                      value={project.description}
                      onChange={(e) => updateProject(index, 'description', e.target.value)}
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      placeholder="Entenda os fundamentos físicos..."
                    />
                    <TextField
                      label="Badge"
                      value={project.badge}
                      onChange={(e) => updateProject(index, 'badge', e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="Fundamentais"
                    />
                    <TextField
                      label="Gradiente CSS"
                      value={project.gradient}
                      onChange={(e) => updateProject(index, 'gradient', e.target.value)}
                      fullWidth
                      size="small"
                      placeholder="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      helperText="Exemplo: linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                    />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
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
