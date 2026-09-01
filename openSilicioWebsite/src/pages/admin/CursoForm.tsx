import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import LexicalEditor from '../../components/LexicalEditor';
import ThumbnailUploadField from '../../components/admin/ThumbnailUploadField';
import { cursosApi, uploadApi } from '../../services/api';
import type { Curso, NivelCurso } from '../../types';

const niveis: NivelCurso[] = ['Iniciante', 'Intermediário', 'Avançado'];

/** Título em slug, para o autor não ter que inventar um à mão. */
export const emSlug = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 255);

export default function CursoForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editando = Boolean(id);

  const [curso, setCurso] = useState<Partial<Curso>>({
    slug: '',
    titulo: '',
    descricao: '',
    ementa: '',
    image_url: '',
    nivel: null,
    publicado: false,
  });
  const [slugTocado, setSlugTocado] = useState(false);
  const [carregando, setCarregando] = useState(editando);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [aviso, setAviso] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!id) return;

    cursosApi
      .getById(id)
      .then((encontrado) => {
        setCurso(encontrado);
        setSlugTocado(true);
      })
      .catch((erro) => {
        console.error('Erro ao carregar curso:', erro);
        setNaoEncontrado(true);
      })
      .finally(() => setCarregando(false));
  }, [id]);

  const definirTitulo = (titulo: string) => {
    setCurso((anterior) => ({
      ...anterior,
      titulo,
      ...(slugTocado ? {} : { slug: emSlug(titulo) }),
    }));
  };

  const enviarCapa = async (arquivo: File) => {
    setEnviandoImagem(true);
    setProgresso(0);
    try {
      const resultado = await uploadApi.uploadTeamMemberImage(arquivo, setProgresso);
      setCurso((anterior) => ({ ...anterior, image_url: resultado.url }));
      setAviso({ open: true, message: 'Capa enviada', severity: 'success' });
    } catch (erro) {
      console.error('Erro ao enviar capa:', erro);
      setAviso({ open: true, message: 'Erro ao enviar a capa', severity: 'error' });
    } finally {
      setEnviandoImagem(false);
    }
  };

  const salvar = async () => {
    if (!curso.titulo?.trim() || !curso.descricao?.trim() || !curso.slug?.trim()) {
      setAviso({ open: true, message: 'Título, descrição e slug são obrigatórios', severity: 'error' });
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        slug: curso.slug,
        titulo: curso.titulo,
        descricao: curso.descricao,
        ementa: curso.ementa || null,
        image_url: curso.image_url || null,
        nivel: curso.nivel || null,
        publicado: curso.publicado ?? false,
      };

      if (editando && id) {
        await cursosApi.update(id, dados);
        setAviso({ open: true, message: 'Curso salvo', severity: 'success' });
      } else {
        const criado = await cursosApi.create(dados);
        setAviso({ open: true, message: 'Curso criado', severity: 'success' });
        navigate(`/admin/cursos/${criado.slug}/estrutura`);
      }
    } catch (erro) {
      console.error('Erro ao salvar curso:', erro);
      setAviso({ open: true, message: 'Erro ao salvar o curso', severity: 'error' });
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <Typography>Carregando...</Typography>;

  // Sem isto, um id inexistente renderizava um formulário em branco com o
  // título "Editar curso", e salvar criaria confusão em vez de um erro.
  if (naoEncontrado) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>Curso não encontrado</Typography>
        <Button component={RouterLink} to="/admin/cursos">Voltar aos cursos</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">{editando ? 'Editar curso' : 'Novo curso'}</Typography>
        <Stack direction="row" spacing={1}>
          {editando && curso.slug && (
            <Button
              startIcon={<AccountTreeIcon />}
              component={RouterLink}
              to={`/admin/cursos/${curso.slug}/estrutura`}
            >
              Estrutura
            </Button>
          )}
          <Button variant="contained" startIcon={<SaveIcon />} onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </Stack>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            label="Título"
            fullWidth
            required
            value={curso.titulo ?? ''}
            onChange={(e) => definirTitulo(e.target.value)}
          />

          <TextField
            label="Slug"
            fullWidth
            required
            value={curso.slug ?? ''}
            onChange={(e) => {
              setSlugTocado(true);
              setCurso({ ...curso, slug: emSlug(e.target.value) });
            }}
            helperText={`Endereço: /cursos/${curso.slug || '...'}`}
          />

          <TextField
            label="Descrição"
            fullWidth
            required
            multiline
            rows={2}
            value={curso.descricao ?? ''}
            onChange={(e) => setCurso({ ...curso, descricao: e.target.value })}
            helperText="Uma linha, mostrada no índice e no cartão da Educação"
          />

          <TextField
            select
            label="Nível"
            fullWidth
            value={curso.nivel ?? ''}
            onChange={(e) => setCurso({ ...curso, nivel: (e.target.value || null) as NivelCurso | null })}
          >
            <MenuItem value="">Sem nível</MenuItem>
            {niveis.map((nivel) => (
              <MenuItem key={nivel} value={nivel}>
                {nivel}
              </MenuItem>
            ))}
          </TextField>

          <ThumbnailUploadField
            label="Capa do curso"
            {...(curso.image_url ? { imageUrl: curso.image_url } : {})}
            uploading={enviandoImagem}
            uploadProgress={progresso}
            onUpload={enviarCapa}
            onRemove={() => setCurso({ ...curso, image_url: '' })}
          />

          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Ementa
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              O que o aluno vai aprender e o que precisa saber antes. Aparece acima do currículo.
            </Typography>
            <LexicalEditor
              content={curso.ementa || ''}
              onContentChange={(ementa) => setCurso((anterior) => ({ ...anterior, ementa }))}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={curso.publicado ?? false}
                onChange={(e) => setCurso({ ...curso, publicado: e.target.checked })}
              />
            }
            label="Publicado"
          />
          <Typography variant="caption" color="text.secondary">
            Um curso publicado pode conter aulas em rascunho: elas aparecem no currículo como "em breve"
            e não contam no progresso.
          </Typography>
        </Stack>
      </Paper>

      <Snackbar open={aviso.open} autoHideDuration={4000} onClose={() => setAviso({ ...aviso, open: false })}>
        <Alert severity={aviso.severity} onClose={() => setAviso({ ...aviso, open: false })}>
          {aviso.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
