export interface User {
  id: string;
  username: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_letter?: string;
  content: string;
  author: string;
  image_url?: string;
  category: string;
  /** Author-provided section titles shown in the post's "Nesta página" box, in display order. */
  toc_items?: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  cover_letter?: string;
  image_url?: string;
  content: string;
  category: string;
  difficulty?: string;
  overview?: string;
  resources?: string;
  toc_items?: string[];
  series?: string | null;
  series_order?: number | null;
  published: boolean;
  created_at: string;
  updated_at: string;
}

/** Vizinhos publicados de um recurso dentro da sua série. */
export interface SeriesNavigation {
  series: string | null;
  position: number | null;
  total: number;
  previous: { id: string; title: string } | null;
  next: { id: string; title: string } | null;
}

export type NivelCurso = 'Iniciante' | 'Intermediário' | 'Avançado';

export interface Curso {
  id: string;
  slug: string;
  titulo: string;
  descricao: string;
  ementa?: string | null;
  image_url?: string | null;
  nivel?: NivelCurso | null;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

/** O curso no índice: sem árvore, com os números já somados pelo backend. */
export interface CursoNaListagem extends Curso {
  modulos: number;
  aulas: number;
  aulas_rascunho: number;
  quizzes: number;
  quizzes_rascunho: number;
  duracao_seg: number;
  /**
   * Aulas publicadas em ordem. O título alimenta a busca da página de Educação,
   * onde a aula não tem cartão próprio; o slug é a chave do progresso guardado
   * no navegador, e sem ele a barra do índice não teria como ser desenhada.
   * `opcional` vem junto porque a barra é desenhada sem abrir o curso.
   */
  aulas_publicadas: Array<{
    id: string;
    modulo_id: string;
    modulo_ordem: number;
    ordem: number;
    slug: string;
    titulo: string;
    duracao_seg: number | null;
    opcional: boolean;
  }>;
  quizzes_publicados: Array<{
    modulo_id: string;
    modulo_ordem: number;
    slug: string;
    titulo: string;
    aula_id: string | null;
    aula_ordem: number | null;
    nota_minima: number;
  }>;
}

/**
 * A união é discriminada por `publicado` porque a aula em rascunho vem sem
 * slug: não há para onde navegar, e o currículo só mostra "em breve".
 */
export type AulaNaArvore =
  | {
      publicado: true;
      id: string;
      slug: string;
      titulo: string;
      duracao_seg: number | null;
      tem_video: boolean;
      /** Aula alternativa: aparece no currículo, mas fora da conta do progresso. */
      opcional: boolean;
    }
  | { publicado: false; id: string; titulo: string };

export type QuizNaArvore =
  | {
      publicado: true;
      id: string;
      aula_id: string | null;
      slug: string;
      titulo: string;
      nota_minima: number;
      total_questoes: number;
    }
  | {
      publicado: false;
      id: string;
      titulo: string;
      /** A posição é pública para manter a linha "em breve" no lugar certo. */
      aula_id: string | null;
      /** Demais metadados aparecem só na árvore autenticada usada pelo admin. */
      slug?: string;
      nota_minima?: number;
      total_questoes?: number;
    };

export type AtividadePublicada =
  | {
      tipo: 'aula';
      slug: string;
      titulo: string;
      opcional: boolean;
      duracao_seg: number | null;
    }
  | { tipo: 'quiz'; slug: string; titulo: string; nota_minima: number };

export interface ModuloNaArvore {
  id: string;
  curso_id: string;
  ordem: number;
  titulo: string;
  resumo?: string | null;
  aulas: AulaNaArvore[];
  quizzes: QuizNaArvore[];
}

export interface CursoComArvore extends Curso {
  modulos: ModuloNaArvore[];
  /** Aulas publicadas, alternativas incluídas: é o tamanho do currículo. */
  total_aulas: number;
  duracao_seg: number;
}

export interface CursoAula {
  id: string;
  curso_id: string;
  modulo_id: string;
  ordem: number;
  slug: string;
  titulo: string;
  video_id?: string | null;
  duracao_seg?: number | null;
  conteudo?: string | null;
  publicado: boolean;
  /** Aula alternativa: publicada, mas fora da contagem de progresso do leitor. */
  opcional: boolean;
  created_at: string;
  updated_at: string;
}

export interface AulaComVizinhas {
  aula: CursoAula;
  curso: Pick<Curso, 'id' | 'slug' | 'titulo'>;
  modulo: { id: string; titulo: string; ordem: number };
  posicao: number;
  total: number;
  anterior: VizinhaDeAtividade | null;
  proxima: VizinhaDeAtividade | null;
}

export type VizinhaDeAtividade =
  | { tipo: 'aula'; slug: string; titulo: string }
  | { tipo: 'quiz'; slug: string; titulo: string };

export interface CursoQuiz {
  id: string;
  curso_id: string;
  modulo_id: string;
  aula_id: string | null;
  ordem: number;
  slug: string;
  titulo: string;
  nota_minima: number;
  publicado: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuizAlternativa {
  id: string;
  ordem: number;
  texto: string;
  correta: boolean;
}

export interface QuizQuestao {
  id: string;
  ordem: number;
  enunciado: string;
  explicacao: string;
  alternativas: QuizAlternativa[];
}

export interface QuizCompleto extends CursoQuiz {
  questoes: QuizQuestao[];
}

export interface QuizComVizinhas {
  quiz: QuizCompleto;
  curso: Pick<Curso, 'id' | 'slug' | 'titulo'>;
  modulo: Pick<CursoModulo, 'id' | 'titulo' | 'ordem'>;
  anterior: VizinhaDeAtividade | null;
  proxima: VizinhaDeAtividade | null;
}

export interface QuizAlternativaInput {
  texto: string;
  correta: boolean;
}

export interface QuizQuestaoInput {
  enunciado: string;
  explicacao: string;
  alternativas: QuizAlternativaInput[];
}

export interface CursoQuizInput {
  modulo_id: string;
  aula_id?: string | null;
  slug: string;
  titulo: string;
  nota_minima?: number;
  publicado?: boolean;
  questoes: QuizQuestaoInput[];
}

export interface CursoModulo {
  id: string;
  curso_id: string;
  ordem: number;
  titulo: string;
  resumo?: string | null;
  created_at: string;
  updated_at: string;
}

/** Onde um verbete da wiki é citado. Serve blog, educação e aulas de curso. */
export interface AparicaoDeVerbete {
  content_type: 'blog' | 'education' | 'curso_aula';
  content_id: string;
  link_text: string;
  titulo: string;
  href: string;
  /** Nome do curso, quando a aparição é uma aula. */
  contexto: string | null;
}

export interface WikiEntry {
  id: string;
  term: string;
  slug: string;
  definition: string;
  cover_letter?: string;
  content: string;
  aliases?: string[];
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WikiLink {
  id: string;
  content_type: 'blog' | 'education' | 'curso_aula';
  content_id: string;
  wiki_entry_id: string;
  link_text: string;
  term?: string;
  slug?: string;
  definition?: string;
  created_at: string;
}

export interface PendingWikiLink {
  id: string;
  term: string;
  content_type: 'blog' | 'education' | 'curso_aula';
  content_id: string;
  context?: string;
  created_at: string;
  content_title?: string;
}

export interface PendingWikiLinkGrouped {
  term: string;
  count: number;
  firstCreated: string;
}

// Pagination metadata
export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

// Settings
export interface TeamMember {
  name: string;
  role: string;
  photo_url?: string;
}

export interface SiteSettings {
  contact_email: string;
  instagram_url: string;
  linkedin_url: string;
  address: string;
  featured_education_ids: string[];
  featured_blog_ids: string[];
  featured_education_resources?: EducationResource[];
  featured_blog_posts?: BlogPost[];
  about_title?: string;
  about_content?: string;
  about_mission?: string;
  about_vision?: string;
  about_history?: string;
  about_team_members?: TeamMember[];
}
