export interface User {
  id: string;
  username: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  author: string;
  image_url?: string;
  category: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EducationResource {
  id: string;
  title: string;
  description: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  category: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WikiEntry {
  id: string;
  term: string;
  slug: string;
  definition: string;
  content: string;
  content_type: 'wysiwyg' | 'markdown';
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface WikiLink {
  id: string;
  content_type: 'blog' | 'education';
  content_id: string;
  wiki_entry_id: string;
  link_text: string;
  term?: string;
  slug?: string;
  created_at: string;
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
export interface FeaturedProject {
  image: string;
  title: string;
  description: string;
  badge: string;
  gradient: string;
}

export interface SiteSettings {
  contact_email: string;
  instagram_url: string;
  linkedin_url: string;
  address: string;
  featured_projects: FeaturedProject[];
}
