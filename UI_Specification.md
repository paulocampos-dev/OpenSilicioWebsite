# OpenSilício — UI Specification

> Living document for redesigning the OpenSilício website. Describes what exists today, what the product must support, and known gaps to address.

**Last updated:** June 2026  
**Codebase:** `openSilicioWebsite/` (React) + `backend/` (API)  
**Language:** Brazilian Portuguese (`pt-BR`)

---

## 1. Product context

### What OpenSilício is

OpenSilício is a university research and extension group at Escola Politécnica da USP focused on **open microelectronics** — democratizing chip design through education, practical projects, and community collaboration.

### Primary audiences

| Audience | Goals on the site |
|----------|-------------------|
| **Students & beginners** | Learn fundamentals, follow tutorials, explore the wiki |
| **Researchers & engineers** | Read technical blog posts, deep-dive project documentation |
| **Group members / admins** | Publish and manage all content via the admin panel |
| **Partners & visitors** | Understand the mission, team, and how to get involved |

### Content pillars

1. **Educação** — structured learning resources (projects, guides, tutorials)
2. **Blog** — technical articles with rich media
3. **Wiki** — technical dictionary with cross-linked terms
4. **Sobre** — mission, vision, history, team (CMS-driven)
5. **Landing** — marketing homepage tying everything together

---

## 2. Technical foundation

### Stack

| Layer | Technology |
|-------|------------|
| UI framework | React 19 + TypeScript |
| Build | Vite 5 |
| Component library | Material UI (MUI) 7 |
| Routing | React Router 7 |
| HTTP | Axios |
| Rich text | Lexical 0.37 (editor + read-only viewer) |
| Math | KaTeX (CDN) |
| API | Node.js + Express + PostgreSQL |
| Auth | JWT (7-day token, `localStorage`) |
| Production hosting | Docker + Nginx (frontend) + Express (backend) |

### Theme system

**File:** `openSilicioWebsite/src/theme.ts`

| Token | Light | Dark |
|-------|-------|------|
| Primary | `#1976d2` | `#90caf9` |
| Secondary | `#9c27b0` | `#ba68c8` |
| Background default | `#f5f7fa` | `#0f0f23` |
| Background paper | `#ffffff` | `#1a1a2e` |
| Text primary | `#1a1a2e` | `#e8eaf6` |
| Border radius | 10px | 10px |
| Font family | `Inter, Roboto, system-ui` (Inter not loaded — falls back) |

**Dark mode:** toggle in public header only; preference stored in `localStorage` key `opensilicio-theme-mode`. Admin has no theme toggle.

**Visual exceptions:** Landing hero and Footer use fixed purple/navy gradients independent of MUI theme.

---

## 3. Information architecture

### Public routes

| Route | Page | Container |
|-------|------|-----------|
| `/` | Landing | Full-bleed (no `Container` padding) |
| `/blog` | Blog listing | `Container py=4` |
| `/blog/:slug` | Single post | `Container py=4` |
| `/educacao` | Education listing | `Container py=4` |
| `/educacao/:id` | Single resource | `Container py=4` |
| `/wiki` | Wiki dictionary | `Container py=4` |
| `/wiki/:slug` | Wiki entry | `Container py=4` |
| `/sobre` | About | `Container py=4` |
| `/login` | Admin login | `Container py=4` |

**Global chrome (public):** Header (logo, nav, theme toggle, mobile drawer) + Footer.

**Missing:** No 404 page. Unmatched routes show a blank content area.

### Admin routes (authenticated)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard hub |
| `/admin/blog` | Post list |
| `/admin/blog/new` | Create post |
| `/admin/blog/edit/:id` | Edit post |
| `/admin/educacao` | Resource list |
| `/admin/educacao/new` | Create resource |
| `/admin/educacao/edit/:id` | Edit resource |
| `/admin/wiki` | Wiki list + pending links |
| `/admin/wiki/new` | Create entry |
| `/admin/wiki/edit/:id` | Edit entry |
| `/admin/configuracoes` | Site settings (not in sidebar — only via Dashboard) |

**Global chrome (admin):** Fixed top bar + permanent left drawer (240px). No public Header/Footer.

---

## 4. Public pages — detailed spec

### 4.1 Landing (`/`)

**Purpose:** Convert visitors into readers; showcase mission and featured content.

**Sections (top to bottom):**

1. **Hero** — Full-viewport gradient (`#667eea → #764ba2`), chip background image, tagline “Democratizando o Design de Chips”, CTAs to Educação / Wiki / Blog
2. **Quick start** — Three cards linking to main content areas
3. **About preview** — Image + short description → link to `/sobre`
4. **Feature grid** — Six value props (education, blog, wiki, open source, community, events) with icons
5. **Partners** — Logo strip (Amigos da Poli)
6. **Featured education** — Up to 3 items from `featured_education_ids` (settings)
7. **Featured blog** — Up to 3 items from `featured_blog_ids` (settings)

**Data source:** `GET /api/settings` (public, cached 2 min).

**Redesign notes:**
- Featured cards have `cursor: pointer` but no navigation — must link to detail pages
- Hero/footer gradients should align with new brand system
- “Projetos Open Source”, “Comunidade”, “Eventos” cards link generically to `/blog` or `/educacao` — consider dedicated sections

### 4.2 Blog listing (`/blog`)

**Purpose:** Browse and search published posts.

**Features:**
- Search by title + excerpt (client-side)
- Category filter chips: `Todos`, `Eletrônica`, `Circuitos Integrados`, `Projeto` (**hardcoded** — may not match admin categories)
- Pagination (6 posts per page)
- Post cards: cover image, title, excerpt, author, date, category chip

**Data:** `GET /api/blog?published=true`

### 4.3 Blog post (`/blog/:slug`)

**Purpose:** Read a full article.

**Layout (top to bottom):**
1. Breadcrumbs: Blog → title
2. Title (h3/h4 responsive)
3. Meta: author • date
4. Cover image (16:9, if `image_url`)
5. **Cover letter** (italic lead text, if `cover_letter`) — on blog, education, and wiki pages
6. Lexical body content
7. Share & cite (LinkedIn, X, Instagram, ABNT, BibTeX)

**Data:** `GET /api/blog/slug/:slug`

### 4.4 Education listing (`/educacao`)

**Purpose:** Browse learning resources.

**Features:**
- Tabs: Todos / Projetos / Guias / Tutoriais
- Difficulty filter: Iniciante / Intermediário / Avançado
- Search by title + description
- Pagination
- Resource cards with category and difficulty chips

**Data:** `GET /api/education?published=true`

### 4.5 Education resource (`/educacao/:id`)

**Purpose:** Read a single resource. URL uses UUID, not slug.

**Standard layout:** Title, description, Lexical content.

**Projects layout** (`category === 'Projetos'`): Tabbed interface:
- **Conteúdo** — main `content`
- **Visão geral** — `overview` (Lexical)
- **Recursos** — `resources` (Lexical)

### 4.6 Wiki listing (`/wiki`)

**Purpose:** Searchable technical dictionary.

**Features:**
- Search by term, definition, aliases
- Cards: term, definition preview
- Links to `/wiki/:slug`

**Data:** `GET /api/wiki?published=true`

### 4.7 Wiki entry (`/wiki/:slug`)

**Purpose:** Definition + detailed explanation.

**Layout:**
- Term (title)
- Definition (subtitle)
- Alias chips (if any)
- Lexical body (if `content`)
- Special state for `pending-*` slugs: placeholder explaining term is being written

### 4.8 About (`/sobre`)

**Purpose:** Organization story and team.

**CMS fields from settings:**
- `about_title`
- `about_content` (Lexical)
- `about_mission` (Lexical)
- `about_vision` (Lexical)
- `about_history` (Lexical)
- `about_team_members[]` — `{ name, role, photo_url? }`

### 4.9 Login (`/login`)

**Purpose:** Admin authentication.

**Fields:** username, password  
**Success:** redirect to `/admin`  
**Missing:** No redirect if already logged in.

### 4.10 Footer (global, public)

**Current content (partially hardcoded):**
- Nav links: Início, Educação, Blog, Wiki, Sobre, Eventos (→ `/educacao`), Projetos (→ `/blog`)
- Contact: hardcoded email — **should use** `contact_email` from settings
- Social: hardcoded Instagram/LinkedIn — **should use** settings
- Address: hardcoded — **should use** `address` from settings
- Google Maps embed
- “Admin” button → `/login`
- Dark gradient background with chip image overlay

---

## 5. Admin panel — detailed spec

### 5.1 Layout

- **Top bar:** “OpenSilício - Admin”, “Ver Site” (→ `/`), “Sair” (logout)
- **Sidebar:** Dashboard, Blog, Educação, Wiki
- **Missing from sidebar:** Configurações (only on Dashboard card)

### 5.2 Dashboard (`/admin`)

Hub with cards linking to Blog, Educação, Wiki, Configurações.

### 5.3 Blog management

#### List (`/admin/blog`)

| Column | Notes |
|--------|-------|
| Title | Link to edit |
| Category | |
| Status | Publicado / Rascunho chip |
| Actions | Publish (drafts), Edit, Delete (confirm dialog) |

Loads all posts (published + drafts), limit 100.

#### Form (`/admin/blog/new`, `/admin/blog/edit/:id`)

**Metadata fields:**

| Field | Label (PT) | Required | Max | Where shown publicly |
|-------|------------|----------|-----|----------------------|
| `title` | Título | Yes | 500 | Post title |
| `slug` | Slug (URL amigável) | Yes | 255 | URL `/blog/:slug` |
| `excerpt` | Resumo | Yes | 1000 | Blog listing, search |
| `cover_letter` | Carta de apresentação | No | 2000 | Article intro on detail page |
| `author` | Autor | Yes (UI) | 255 | Post meta |
| `category` | Categoria | Yes (UI) | 100 | Listing chip; free-text Autocomplete |
| `image_url` | Imagem de Capa | No | — | Hero image on post page + listing |
| `content` | Conteúdo | Yes | 50MB | Lexical body |
| `published` | — | — | — | Publish/Despublicar button |

**Editor features:** Full Lexical toolbar + wiki link inserter (`contentType="blog"`).

**Workflow:**
- Auto-save every 30s (existing posts only)
- Preview toggle (mirrors public post layout)
- New post: save → redirect to edit URL
- Cover upload via compressed image endpoint

**Field order in form:** Título → Slug → Resumo → **Carta de apresentação** → Autor → Categoria → Imagem de Capa → Conteúdo

### 5.4 Education management

#### List (`/admin/educacao`)

Same table pattern as blog. No `difficulty` column (but field exists).

#### Form

| Field | Label | Required | Notes |
|-------|-------|----------|-------|
| `title` | Título | Yes | |
| `description` | Descrição | Yes | Card preview |
| `category` | Categoria | Yes | Projetos / Guias / Tutoriais |
| `difficulty` | Dificuldade | No | Iniciante / Intermediário / Avançado |
| `content` | Conteúdo | Yes | Lexical |
| `overview` | Visão geral | No | Projetos only |
| `resources` | Recursos | No | Projetos only |
| `published` | — | — | Publish button |

Preview with tabs for Projetos category.

### 5.5 Wiki management

#### List (`/admin/wiki`)

- All entries table (publish, edit, delete)
- **Pending links panel** — terms referenced in content but not yet defined; “Criar Entrada” pre-fills new form

#### Form

| Field | Label | Required | Notes |
|-------|-------|----------|-------|
| `term` | Termo | Yes | |
| `slug` | Slug | Yes | |
| `definition` | Definição | Yes | Card + subtitle |
| `aliases` | Apelidos | No | Chip array |
| `content` | Conteúdo detalhado | No | Lexical (no wiki-link button) |
| `published` | Publicado | — | Switch + Publish button (dual control) |

**UX inconsistency:** Uses `alert()` instead of Snackbar.

### 5.6 Settings (`/admin/configuracoes`)

**Contact tab:**
- `contact_email`, `instagram_url`, `linkedin_url`, `address`

**Featured content tab:**
- `featured_education_ids[]` (max 3)
- `featured_blog_ids[]` (max 3)

**About tab:**
- `about_title`, `about_content`, `about_mission`, `about_vision`, `about_history`
- `about_team_members[]` with photo upload

**Security tab:**
- Change password (`authApi.changePassword`)

Single “Salvar Configurações” button per save.

---

## 6. Lexical editor — capabilities

**Admin editor:** `components/LexicalEditor.tsx`  
**Public viewer:** `components/LexicalContent.tsx`

### Toolbar

- Undo / redo
- Block types: paragraph, H1–H3, quote, bullet/numbered list, code block
- Inline: bold, italic, underline, strikethrough, code
- Alignment: left, center, right, justify
- Insert: hyperlink, YouTube, image gallery, inline equation, block equation
- Wiki link button (blog + education only)

### Media

| Type | How to add | Public behavior |
|------|------------|-----------------|
| Single image | Paste or drag-drop | Upload to `/api/upload`; lightbox on click |
| Image gallery | Toolbar, multi-paste, or right-click merge | Grid or carousel layout; lightbox |
| YouTube | Toolbar URL prompt | Embedded iframe |
| Equation | Toolbar or `$...$` / `$$...$$` auto-transform | KaTeX render |

### Wiki links

- **Existing entry:** searchable dialog → link to `/wiki/:slug`
- **Pending term:** creates placeholder at `/wiki/pending-{term}`; admin can resolve later

### Storage

Content stored as **JSON string** (Lexical `editorState.toJSON()`).

---

## 7. Content model summary

```
BlogPost
├── slug, title, excerpt, cover_letter?, content
├── author, image_url?, category, published
└── created_at, updated_at

EducationResource
├── title, description, cover_letter?, content, category, difficulty?
├── overview?, resources?  (Projetos only)
└── published, timestamps

WikiEntry
├── term, slug, definition, cover_letter?, content?, aliases[]
└── published, timestamps

SiteSettings (key-value)
├── contact_email, instagram_url, linkedin_url, address
├── featured_education_ids[], featured_blog_ids[]
└── about_* fields + about_team_members[]

User
└── id, username (JWT auth)
```

---

## 8. Authentication flow

```
/login → POST /api/auth/login → { token, user } → localStorage
       → redirect /admin

ProtectedRoute → verify token on mount → GET /api/auth/verify
               → fail: clear storage, redirect /login

API requests → Authorization: Bearer {token}

Logout → clear localStorage → redirect /
```

---

## 9. API patterns

**Base URL:** `/api` (Nginx proxies to backend in production)

| Module | Key endpoints |
|--------|---------------|
| `authApi` | login, verify, changePassword |
| `blogApi` | CRUD, getBySlug, getCategories |
| `educationApi` | CRUD, getById |
| `wikiApi` | CRUD, getBySlug, search, aliases, pending links |
| `uploadApi` | uploadFile (editor), uploadTeamMemberImage (covers/photos) |
| `settingsApi` | getAll (public), update (auth) |

**Pagination:** Server returns `{ data, pagination }` but most public pages fetch up to 100 items and paginate client-side.

**Uploads served at:** `/uploads/{filename}`

---

## 10. Assets

### Static (`openSilicioWebsite/public/`)

| File | Usage |
|------|-------|
| `open-silicio-logo.jpg` | Header logo, favicon |
| `chip_closeup_stock.jpg` | Landing hero, card fallbacks |
| `boardPCB_stocl.jpg` | Landing about section (filename typo) |
| `closeup_electronic_stock.jpg` | Footer background |
| `amigos-da-poli-logo-sem-bg.png` | Partners section |

### Runtime uploads (`backend/uploads/`)

Blog covers, team photos, inline Lexical images.

---

## 11. Redesign requirements — what the UI must have

### Must keep (functional)

- [ ] All public routes and admin CRUD flows
- [ ] Lexical editor with images, galleries, equations, YouTube, wiki links
- [ ] Dark / light mode on public site
- [ ] Mobile-responsive navigation (drawer on small screens)
- [ ] Blog: excerpt (listing) + cover_letter (article intro) + cover image + body — three distinct text/image layers
- [ ] Education: tabbed layout for Projetos
- [ ] Wiki: pending term workflow
- [ ] Settings-driven About page and featured content on Landing
- [ ] Share & cite on blog posts
- [ ] Admin auth gate
- [ ] Image lightbox on public content

### Should fix during redesign

- [ ] **404 page**
- [ ] **Footer wired to settings** (email, social, address)
- [ ] **Settings in admin sidebar**
- [ ] **Dark mode in admin** (or intentional light-only with rationale)
- [ ] **Unified admin feedback** (Snackbars, not `alert()`)
- [ ] **Blog categories:** sync listing filters with actual categories from API
- [ ] **Featured cards on Landing** must navigate to content
- [ ] **Load Inter font** (or choose a new typeface deliberately)
- [ ] **Theme consistency:** hero/footer gradients vs MUI palette
- [ ] **Login redirect** when already authenticated
- [ ] **Education admin list** show difficulty column
- [ ] **Rename** cover upload endpoint usage (currently `uploadTeamMemberImage`)

### Nice to have

- [ ] Dedicated Eventos / Projetos pages (currently aliased to Educação/Blog)
- [ ] Server-side search/pagination for large content libraries
- [ ] i18n framework (if ever needed beyond PT-BR)
- [ ] Onboarding empty states in admin
- [ ] Improved post writing layout (sidebar metadata, full-width editor, adjacent image controls)

---

## 12. Known production / caching notes

### Cover letter field not visible

The field **exists in code** (`BlogForm.tsx`, label “Carta de apresentação”, between Resumo and Autor). If it does not appear:

1. **Hard refresh** the admin page (`Ctrl+Shift+R` / `Cmd+Shift+R`)
2. Confirm you are in **Edit** mode, not **Preview** mode (Preview hides the form)
3. Production may be serving a **cached frontend bundle** — Nginx caches `.js` files for 1 year; deploy must rebuild frontend with a new git SHA (see `CACHEBUST` build arg in `docker/Dockerfile.frontend.prod`)
4. On VPS, verify latest code: `cd /opt/opensilicio && git log -1 --oneline` should include commit `f9f145c` or later
5. Force rebuild: `export CACHEBUST=$(git rev-parse HEAD) && docker compose --env-file .env -f docker/docker-compose.prod.yml up -d --build`

### Database migration

Cover letter requires migration `009_add_cover_letter_to_blog_posts.sql`. Deploy workflow runs `npm run migrate` automatically. Existing posts are unaffected (`cover_letter` is nullable).

---

## 13. Key source files

| Area | Path |
|------|------|
| Routes | `openSilicioWebsite/src/App.tsx` |
| Theme | `openSilicioWebsite/src/theme.ts` |
| Types | `openSilicioWebsite/src/types/index.ts` |
| API client | `openSilicioWebsite/src/services/api.ts` |
| Auth | `openSilicioWebsite/src/contexts/AuthContext.tsx` |
| Lexical editor | `openSilicioWebsite/src/components/LexicalEditor.tsx` |
| Lexical viewer | `openSilicioWebsite/src/components/LexicalContent.tsx` |
| Admin shell | `openSilicioWebsite/src/components/AdminLayout.tsx` |
| Blog form | `openSilicioWebsite/src/pages/admin/BlogForm.tsx` |
| Backend validation | `backend/src/middleware/validation.ts` |
| Deploy workflow | `.github/workflows/deploy.yml` |

---

## 14. Suggested redesign structure

For a cohesive redesign, consider organizing work into these workstreams:

1. **Design system** — color, typography, spacing, components (replace ad-hoc gradients)
2. **Public marketing** — Landing, About, Footer
3. **Content reading** — Blog, Education, Wiki detail pages
4. **Content discovery** — listings, search, filters
5. **Admin authoring** — especially blog/education writing experience (metadata sidebar, editor canvas, media layout)
6. **Admin management** — tables, settings, pending wiki workflow

Each workstream should preserve the API contracts and content fields defined in this document.
