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
  category: string;
  overview?: string;
  resources?: string;
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
  aliases?: string[];
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

export interface PendingWikiLink {
  id: string;
  term: string;
  content_type: 'blog' | 'education';
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
