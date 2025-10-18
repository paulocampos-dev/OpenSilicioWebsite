import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Stack,
  Typography,
  Card,
  CardContent,
  Avatar,
  Divider,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { settingsApi } from '../services/api';
import type { SiteSettings } from '../types';

export default function About() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsApi.getAll();
      setSettings(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Erro ao carregar informações</Typography>
      </Box>
    );
  }

  const renderContent = (content?: string, contentType?: 'wysiwyg' | 'markdown') => {
    if (!content) return null;

    if (contentType === 'markdown') {
      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
    }
    return <div dangerouslySetInnerHTML={{ __html: content }} />;
  };

  return (
    <Stack spacing={8}>
      {/* Hero Section */}
      <Stack spacing={2} textAlign="center" alignItems="center">
        <Typography sx={{ typography: { xs: 'h3', md: 'h2' } }} fontWeight={900}>
          {settings.about_title || 'Sobre o OpenSilício'}
        </Typography>
      </Stack>

      {/* Main Content */}
      {settings.about_content && (
        <Box>
          {renderContent(settings.about_content, settings.about_content_type)}
        </Box>
      )}

      <Divider />

      {/* Mission & Vision */}
      {(settings.about_mission || settings.about_vision) && (
        <Grid container spacing={6}>
          {settings.about_mission && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)' }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main">
                    Nossa Missão
                  </Typography>
                  {renderContent(settings.about_mission, settings.about_mission_type)}
                </CardContent>
              </Card>
            </Grid>
          )}

          {settings.about_vision && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: '100%', background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.05) 0%, rgba(245, 87, 108, 0.05) 100%)' }}>
                <CardContent>
                  <Typography variant="h5" fontWeight={700} gutterBottom color="secondary.main">
                    Nossa Visão
                  </Typography>
                  {renderContent(settings.about_vision, settings.about_vision_type)}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* History */}
      {settings.about_history && (
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Nossa História
          </Typography>
          <Divider sx={{ mb: 3 }} />
          {renderContent(settings.about_history, settings.about_history_type)}
        </Box>
      )}

      {/* Team */}
      {settings.about_team_members && settings.about_team_members.length > 0 && (
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom textAlign="center">
            Nossa Equipe
          </Typography>
          <Divider sx={{ mb: 4 }} />
          <Grid container spacing={4} justifyContent="center">
            {settings.about_team_members.map((member, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card sx={{ height: '100%', textAlign: 'center' }}>
                  <CardContent>
                    <Stack spacing={2} alignItems="center">
                      {member.photo_url ? (
                        <Avatar
                          src={member.photo_url}
                          alt={member.name}
                          sx={{ width: 100, height: 100 }}
                        />
                      ) : (
                        <Avatar sx={{ width: 100, height: 100, fontSize: '2rem' }}>
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                      )}
                      <Box>
                        <Typography variant="h6" fontWeight={700}>
                          {member.name}
                        </Typography>
                        <Typography color="text.secondary" variant="body2">
                          {member.role}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Stack>
  );
}
