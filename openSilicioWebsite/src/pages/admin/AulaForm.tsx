import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import LexicalEditor from '../../components/LexicalEditor';
import { cursosApi } from '../../services/api';
import type { CursoAula, CursoComArvore } from '../../types';
import { comoRelogio, segundosDe } from '../../utils/duracao';
import { emSlug } from './CursoForm';

/**
 * O formulário aceita a URL inteira do YouTube; quem converte para o id de 11
 * caracteres é o backend, que é a única fonte da verdade sobre o que vai para o
 * banco. Isto aqui só serve para mostrar a previa enquanto o autor digita.
 */
const idDoYouTube = (entrada: string): string | null => {
  const limpo = entrada.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(limpo)) return limpo;

  const padroes = [
    /[?&]v=([A-Za-z0-9_-]{11})/,
    /youtu\.be\/([A-Za-z0-9_-]{11})/,
    /\/embed\/([A-Za-z0-9_-]{11})/,
    /\/shorts\/([A-Za-z0-9_-]{11})/,
  ];
  for (const padrao of padroes) {
    const achado = padrao.exec(limpo);
    if (achado?.[1]) return achado[1];
  }
  return null;
};

export default function AulaForm() {
  const { cursoSlug, aulaId } = useParams<{ cursoSlug: string; aulaId: string }>();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const editando = aulaId !== 'nova';

  const [curso, setCurso] = useState<CursoComArvore | null>(null);
  const [aula, setAula] = useState<Partial<CursoAula>>({
    modulo_id: params.get('modulo') ?? '',
    slug: '',
    titulo: '',
    video_id: '',
    conteudo: '',
    publicado: false,
  });
  const [duracao, setDuracao] = useState('');
  const [slugTocado, setSlugTocado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (!cursoSlug) return;

    const carregarTudo = async () => {
      try {
        const arvore = await cursosApi.getCompleto(cursoSlug);
        setCurso(arvore);

        if (editando && aulaId) {
          const existente = await cursosApi.getAulaById(aulaId);
          setAula(existente);
          setDuracao(existente.duracao_seg ? comoRelogio(existente.duracao_seg) : '');
          setSlugTocado(true);
        } else if (!params.get('modulo') && arvore.modulos.length > 0) {
          setAula((anterior) => ({ ...anterior, modulo_id: arvore.modulos[0]!.id }));
        }
      } catch (erro) {
        console.error('Erro ao carregar a aula:', erro);
      } finally {
        setCarregando(false);
      }
    };

    carregarTudo();
  }, [cursoSlug, aulaId, editando, params]);

  const definirTitulo = (titulo: string) => {
    setAula((anterior) => ({ ...anterior, titulo, ...(slugTocado ? {} : { slug: emSlug(titulo) }) }));
  };

  const salvar = async () => {
    if (!curso) return;

    if (!aula.titulo?.trim() || !aula.slug?.trim() || !aula.modulo_id) {
      setAviso({ open: true, message: 'Título, slug e módulo são obrigatórios', severity: 'error' });
      return;
    }

    const segundos = duracao.trim() === '' ? null : segundosDe(duracao);
    if (duracao.trim() !== '' && segundos === null) {
      setAviso({ open: true, message: 'Duração deve estar em mm:ss, por exemplo 14:20', severity: 'error' });
      return;
    }

    if (aula.video_id?.trim() && idDoYouTube(aula.video_id) === null) {
      setAviso({ open: true, message: 'Não reconheci um vídeo do YouTube nesse endereço', severity: 'error' });
      return;
    }

    setSalvando(true);
    try {
      const dados = {
        modulo_id: aula.modulo_id,
        slug: aula.slug,
        titulo: aula.titulo,
        video_id: aula.video_id?.trim() || null,
        duracao_seg: segundos,
        conteudo: aula.conteudo || null,
        publicado: aula.publicado ?? false,
      };

      if (editando && aulaId) {
        const salva = await cursosApi.atualizarAula(aulaId, dados);
        setAula(salva);
        setAviso({ open: true, message: 'Aula salva', severity: 'success' });
      } else {
        const criada = await cursosApi.criarAula(curso.id, dados);
        setAviso({ open: true, message: 'Aula criada', severity: 'success' });
        navigate(`/admin/cursos/${curso.slug}/aulas/${criada.id}`, { replace: true });
      }
    } catch (erro) {
      console.error('Erro ao salvar a aula:', erro);
      setAviso({ open: true, message: 'Erro ao salvar a aula', severity: 'error' });
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <Typography>Carregando...</Typography>;
  if (!curso) return <Typography>Curso não encontrado.</Typography>;

  const previa = aula.video_id ? idDoYouTube(aula.video_id) : null;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4">{editando ? 'Editar aula' : 'Nova aula'}</Typography>
          <Typography variant="body2" color="text.secondary">
            <RouterLink to={`/admin/cursos/${curso.slug}/estrutura`}>{curso.titulo}</RouterLink>
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </Button>
      </Stack>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <TextField
            select
            label="Módulo"
            fullWidth
            required
            value={aula.modulo_id ?? ''}
            onChange={(e) => setAula({ ...aula, modulo_id: e.target.value })}
            helperText="Mover a aula entre módulos não muda o endereço dela"
          >
            {curso.modulos.map((modulo, indice) => (
              <MenuItem key={modulo.id} value={modulo.id}>
                {indice + 1}. {modulo.titulo}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Título"
            fullWidth
            required
            value={aula.titulo ?? ''}
            onChange={(e) => definirTitulo(e.target.value)}
          />

          <TextField
            label="Slug"
            fullWidth
            required
            value={aula.slug ?? ''}
            onChange={(e) => {
              setSlugTocado(true);
              setAula({ ...aula, slug: emSlug(e.target.value) });
            }}
            helperText={`Endereço: /cursos/${curso.slug}/${aula.slug || '...'}`}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              label="Vídeo do YouTube"
              fullWidth
              value={aula.video_id ?? ''}
              onChange={(e) => setAula({ ...aula, video_id: e.target.value })}
              helperText={
                previa
                  ? `Vídeo reconhecido: ${previa}`
                  : 'Cole a URL do YouTube, ou deixe em branco para uma aula só de texto'
              }
              error={Boolean(aula.video_id?.trim()) && previa === null}
            />
            <TextField
              label="Duração"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              placeholder="14:20"
              helperText="mm:ss"
              sx={{ minWidth: 160 }}
            />
          </Stack>

          {previa && (
            <Box sx={{ position: 'relative', paddingTop: '56.25%', maxWidth: 480 }}>
              <Box
                component="iframe"
                src={`https://www.youtube-nocookie.com/embed/${previa}`}
                title="Prévia do vídeo"
                allowFullScreen
                sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
              />
            </Box>
          )}

          <Box>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Conteúdo
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              As notas da aula, abaixo do vídeo. Os termos da wiki ligados aqui viram os chips de
              "Termos usados aqui".
            </Typography>
            <LexicalEditor
              content={aula.conteudo || ''}
              onContentChange={(conteudo) => setAula((anterior) => ({ ...anterior, conteudo }))}
              contentType="curso_aula"
              contentId={aula.id}
              onBeforeWikiLink={async () => {
                // O diálogo da wiki precisa de um id, então a aula nova é salva antes.
                if (!aula.id) await salvar();
              }}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={aula.publicado ?? false}
                onChange={(e) => setAula({ ...aula, publicado: e.target.checked })}
              />
            }
            label="Publicada"
          />
          <Typography variant="caption" color="text.secondary">
            Em rascunho, a aula aparece no currículo como "em breve", sem endereço, e fica fora da
            contagem de progresso.
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
