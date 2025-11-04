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
  IconButton,
  Divider,
  Tab,
  Tabs,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/Upload';
import { settingsApi, educationApi, blogApi, uploadApi } from '../../services/api';
import type { SiteSettings, EducationResource, BlogPost, TeamMember } from '../../types';
import LexicalEditor from '../../components/LexicalEditor';

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
  const [aboutTab, setAboutTab] = useState<'main' | 'mission' | 'vision' | 'history' | 'team'>('main');
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleChangePassword = async () => {
    setChangingPassword(true);
    setPasswordMessage(null);

    // Validação básica
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Todos os campos são obrigatórios' });
      setChangingPassword(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem' });
      setChangingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 8 caracteres' });
      setChangingPassword(false);
      return;
    }

    // Validação de complexidade
    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    const hasSpecialChar = /[@$!%*?&]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setPasswordMessage({ 
        type: 'error', 
        text: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais (@$!%*?&)' 
      });
      setChangingPassword(false);
      return;
    }

    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      
      // Limpar campos
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.details?.[0]?.message || 'Erro ao alterar senha';
      setPasswordMessage({ type: 'error', text: errorMessage });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index);
    setUploadProgress(0);
    setMessage(null);

    try {
      const result = await uploadApi.uploadTeamMemberImage(file, (progress) => {
        setUploadProgress(progress);
      });

      // Update the team member's photo URL
      const newMembers = [...(settings.about_team_members || [])];
      newMembers[index].photo_url = result.url;
      setSettings({ ...settings, about_team_members: newMembers });

      setMessage({
        type: 'success',
        text: `Imagem enviada! Tamanho original: ${(result.originalSize / 1024).toFixed(1)}KB, Comprimido: ${(result.size / 1024).toFixed(1)}KB (${result.compressionRatio} redução)`
      });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Erro ao enviar imagem' });
    } finally {
      setUploadingIndex(null);
      setUploadProgress(0);
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

      {/* About Page Content */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Página "Sobre"
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Gerencie o conteúdo da página Sobre o OpenSilício
          </Typography>

          <Tabs value={aboutTab} onChange={(_, v) => setAboutTab(v)} sx={{ mb: 3 }}>
            <Tab value="main" label="Principal" />
            <Tab value="mission" label="Missão" />
            <Tab value="vision" label="Visão" />
            <Tab value="history" label="História" />
            <Tab value="team" label="Equipe" />
          </Tabs>

          <Divider sx={{ mb: 3 }} />

          {aboutTab === 'main' && (
            <Stack spacing={3}>
              <TextField
                label="Título da Página"
                value={settings.about_title || ''}
                onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                fullWidth
              />
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Conteúdo Principal
                </Typography>
                <LexicalEditor
                  content={settings.about_content || ''}
                  onContentChange={(content) => setSettings({ ...settings, about_content: content })}
                />
              </Box>
            </Stack>
          )}

          {aboutTab === 'mission' && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Missão
              </Typography>
              <LexicalEditor
                content={settings.about_mission || ''}
                onContentChange={(content) => setSettings({ ...settings, about_mission: content })}
              />
            </Box>
          )}

          {aboutTab === 'vision' && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Visão
              </Typography>
              <LexicalEditor
                content={settings.about_vision || ''}
                onContentChange={(content) => setSettings({ ...settings, about_vision: content })}
              />
            </Box>
          )}

          {aboutTab === 'history' && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                História
              </Typography>
              <LexicalEditor
                content={settings.about_history || ''}
                onContentChange={(content) => setSettings({ ...settings, about_history: content })}
              />
            </Box>
          )}

          {aboutTab === 'team' && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Membros da Equipe
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={() => {
                    const newMember: TeamMember = { name: '', role: '', photo_url: '' };
                    setSettings({
                      ...settings,
                      about_team_members: [...(settings.about_team_members || []), newMember],
                    });
                  }}
                >
                  Adicionar Membro
                </Button>
              </Box>

              {(settings.about_team_members || []).map((member, index) => (
                <Card key={index} variant="outlined">
                  <CardContent>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2">Membro {index + 1}</Typography>
                        <IconButton
                          color="error"
                          onClick={() => {
                            const newMembers = [...(settings.about_team_members || [])];
                            newMembers.splice(index, 1);
                            setSettings({ ...settings, about_team_members: newMembers });
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <TextField
                        label="Nome"
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...(settings.about_team_members || [])];
                          newMembers[index].name = e.target.value;
                          setSettings({ ...settings, about_team_members: newMembers });
                        }}
                        fullWidth
                      />
                      <TextField
                        label="Cargo/Função"
                        value={member.role}
                        onChange={(e) => {
                          const newMembers = [...(settings.about_team_members || [])];
                          newMembers[index].role = e.target.value;
                          setSettings({ ...settings, about_team_members: newMembers });
                        }}
                        fullWidth
                      />

                      <Box>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                          Foto do Membro
                        </Typography>

                        {member.photo_url && (
                          <Box sx={{ mb: 2, textAlign: 'center' }}>
                            <Box
                              component="img"
                              src={member.photo_url}
                              alt={member.name}
                              sx={{
                                width: 120,
                                height: 120,
                                borderRadius: '50%',
                                objectFit: 'cover',
                                border: '3px solid',
                                borderColor: 'primary.main',
                              }}
                            />
                          </Box>
                        )}

                        <Button
                          variant="outlined"
                          component="label"
                          fullWidth
                          startIcon={<UploadIcon />}
                          disabled={uploadingIndex === index}
                        >
                          {uploadingIndex === index
                            ? `Enviando... ${uploadProgress}%`
                            : member.photo_url
                            ? 'Trocar Foto'
                            : 'Enviar Foto'}
                          <input
                            type="file"
                            hidden
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(index, file);
                              }
                            }}
                          />
                        </Button>

                        {uploadingIndex === index && (
                          <Box sx={{ width: '100%', mt: 1 }}>
                            <Box
                              sx={{
                                width: `${uploadProgress}%`,
                                height: 4,
                                bgcolor: 'primary.main',
                                borderRadius: 2,
                                transition: 'width 0.3s',
                              }}
                            />
                          </Box>
                        )}

                        {member.photo_url && (
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              const newMembers = [...(settings.about_team_members || [])];
                              newMembers[index].photo_url = '';
                              setSettings({ ...settings, about_team_members: newMembers });
                            }}
                            sx={{ mt: 1 }}
                          >
                            Remover Foto
                          </Button>
                        )}

                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                          Formatos aceitos: JPEG, PNG, WebP. Máximo 5MB. A imagem será redimensionada e comprimida automaticamente.
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}

              {(!settings.about_team_members || settings.about_team_members.length === 0) && (
                <Typography color="text.secondary" textAlign="center" sx={{ py: 4 }}>
                  Nenhum membro adicionado. Clique em "Adicionar Membro" para começar.
                </Typography>
              )}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Alterar Senha
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Altere a senha de acesso à área administrativa
          </Typography>

          {passwordMessage && (
            <Alert severity={passwordMessage.type} onClose={() => setPasswordMessage(null)} sx={{ mb: 3 }}>
              {passwordMessage.text}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Senha Atual"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              disabled={changingPassword}
            />
            <TextField
              label="Nova Senha"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              disabled={changingPassword}
              helperText="Mínimo 8 caracteres, com letras maiúsculas, minúsculas, números e caracteres especiais"
            />
            <TextField
              label="Confirmar Nova Senha"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              disabled={changingPassword}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </Box>
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
