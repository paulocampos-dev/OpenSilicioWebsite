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
  duracao_seg: number;
  /**
   * Aulas publicadas em ordem. O título alimenta a busca da página de Educação,
   * onde a aula não tem cartão próprio; o slug é a chave do progresso guardado
   * no navegador, e sem ele a barra do índice não teria como ser desenhada.
   */
  aulas_publicadas: Array<{ slug: string; titulo: string; duracao_seg: number | null }>;
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
    }
  | { publicado: false; id: string; titulo: string };

export interface ModuloNaArvore {
  id: string;
  curso_id: string;
  ordem: number;
  titulo: string;
  resumo?: string | null;
  aulas: AulaNaArvore[];
}

export interface CursoComArvore extends Curso {
  modulos: ModuloNaArvore[];
  /** Aulas publicadas: é o denominador do progresso do leitor. */
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
  created_at: string;
  updated_at: string;
}

export interface AulaComVizinhas {
  aula: CursoAula;
  curso: Pick<Curso, 'id' | 'slug' | 'titulo'>;
  modulo: { id: string; titulo: string; ordem: number };
  posicao: number;
  total: number;
  anterior: { slug: string; titulo: string } | null;
  proxima: { slug: string; titulo: string } | null;
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
