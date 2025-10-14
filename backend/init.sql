-- Criar extensão para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de posts do blog
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    excerpt TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'wysiwyg' CHECK (content_type IN ('wysiwyg', 'markdown')),
    author VARCHAR(255),
    image_url TEXT,
    category VARCHAR(100),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de recursos educacionais
CREATE TABLE IF NOT EXISTS education_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'wysiwyg' CHECK (content_type IN ('wysiwyg', 'markdown')),
    category VARCHAR(100),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de entradas da wiki
CREATE TABLE IF NOT EXISTS wiki_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    definition TEXT NOT NULL,
    content TEXT,
    content_type VARCHAR(20) DEFAULT 'wysiwyg' CHECK (content_type IN ('wysiwyg', 'markdown')),
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de links de conteúdo para wiki
CREATE TABLE IF NOT EXISTS content_wiki_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(20) NOT NULL CHECK (content_type IN ('blog', 'education')),
    content_id UUID NOT NULL,
    wiki_entry_id UUID NOT NULL REFERENCES wiki_entries(id) ON DELETE CASCADE,
    link_text VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_education_resources_published ON education_resources(published);
CREATE INDEX IF NOT EXISTS idx_wiki_entries_slug ON wiki_entries(slug);
CREATE INDEX IF NOT EXISTS idx_wiki_entries_term ON wiki_entries(term);
CREATE INDEX IF NOT EXISTS idx_wiki_entries_published ON wiki_entries(published);
CREATE INDEX IF NOT EXISTS idx_content_wiki_links_content ON content_wiki_links(content_type, content_id);

-- Usuário administrador será criado pelo script seedAdmin.ts
-- Username: AdmOpen
-- Password: Test123

