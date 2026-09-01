# Cursos: design

**Date:** 2026-09-01
**Status:** awaiting review
**Mocks:** https://a2arn2w7843o.postplan.dev (variants C, E, F selected)

## Summary

A fourth public tab, `/cursos`, holding structured courses: `curso` to `módulo` to
`aula`. Video is first-class data on an aula, sourced from YouTube. Reading
progress is visible to the reader and stored in their own browser. Courses are
their own content type with their own tables and admin, not a view over
`education_resources`.

The existing 04 to 19 trilha in Educação stays exactly where it is. Cursos starts
empty.

## Decisions

| Question | Decision |
|---|---|
| Content model | Own tables. Not a projection of `education_resources`. |
| Depth | curso, módulo, aula |
| Video | First-class on the aula, YouTube only |
| Progress | Visible to the reader, `localStorage`, no accounts |
| Index page | Mock **C**: resume panel when progress exists, then dense index rows |
| Course page | Mock **E**: two column, ementa and tree left, sticky progress panel right |
| Aula page | Mock **F**: persistent left spine carrying the whole course tree |
| Completion | Both automatic and manual |
| Discoverability | Curso appears once in Educação; aulas reachable via wiki and search |
| Existing trilha | Stays in Educação, untouched |
| Draft aulas | A published curso may contain unpublished aulas |

## Data model

Three new tables. Migration `014_cursos.sql`.

```sql
CREATE TABLE cursos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug        VARCHAR(255) UNIQUE NOT NULL,
    titulo      VARCHAR(500) NOT NULL,
    descricao   TEXT NOT NULL,          -- one line, used on cards and rows
    ementa      TEXT,                   -- Lexical JSON: o que você vai aprender
    image_url   TEXT,
    nivel       VARCHAR(20) CHECK (nivel IN ('Iniciante', 'Intermediário', 'Avançado')),
    publicado   BOOLEAN DEFAULT false,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE curso_modulos (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id    UUID NOT NULL REFERENCES cursos(id) ON DELETE CASCADE,
    ordem       INTEGER NOT NULL,
    titulo      VARCHAR(500) NOT NULL,
    resumo      TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Sustenta a chave composta em curso_aulas.
    UNIQUE (curso_id, id)
);

CREATE TABLE curso_aulas (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id     UUID NOT NULL,
    modulo_id    UUID NOT NULL,
    ordem        INTEGER NOT NULL,
    slug         VARCHAR(255) NOT NULL,
    titulo       VARCHAR(500) NOT NULL,
    video_id     VARCHAR(20),            -- id do YouTube, 11 caracteres
    duracao_seg  INTEGER,
    conteudo     TEXT,                   -- Lexical JSON
    publicado    BOOLEAN DEFAULT false,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- A chave composta garante que o curso da aula é sempre o curso do seu
    -- módulo. Sem ela, um update em modulo_id poderia mudar a aula de curso
    -- e deixar curso_id mentindo.
    FOREIGN KEY (curso_id, modulo_id)
        REFERENCES curso_modulos (curso_id, id) ON DELETE CASCADE,

    -- A URL é /cursos/:curso/:aula, então o slug precisa ser único no curso,
    -- não no módulo: assim uma aula troca de módulo sem trocar de endereço.
    UNIQUE (curso_id, slug)
);

CREATE INDEX idx_cursos_publicado ON cursos(publicado);
CREATE INDEX idx_curso_modulos_curso ON curso_modulos(curso_id, ordem);
CREATE INDEX idx_curso_aulas_modulo ON curso_aulas(modulo_id, ordem);
```

Notes on the shape:

- `curso_id` on `curso_aulas` is denormalized on purpose. Every read query needs
  it, and the composite foreign key makes it impossible for it to disagree with
  the módulo. The redundancy is enforced by the database, not by discipline.
- `ordem` carries no unique constraint. Reordering under one would need deferred
  constraints; instead the reorder endpoint rewrites every position in the list
  inside one transaction. Reads sort by `ordem, id` so ties are still stable.
- `video_id` stores the YouTube id rather than a URL, matching `YouTubeNode`,
  which embeds `https://www.youtube-nocookie.com/embed/${videoID}`. A second
  video source would need a `video_fonte` column; not now.
- Deleting a curso cascades to every módulo and every aula body.

## API

New routes under `/api/cursos`, following the existing controller and service
split (`CursoService extends BaseService`, thin controller, zod schema in
`validation.ts`).

| Route | Returns |
|---|---|
| `GET /api/cursos?published=true` | List with aggregate counts: `modulos`, `aulas`, `aulas_rascunho`, `duracao_seg`, plus `aulas_publicadas` (slug and title of each). One query with two lateral joins, not N+1. |
| `GET /api/cursos/:slug` | Curso plus the whole módulo and aula tree. Titles, slugs, durations and `publicado` only. No aula bodies. The syllabus in one request. |
| `GET /api/cursos/:slug/aulas/:aulaSlug` | One aula with its body, plus previous and next within the course. |
| `POST /api/cursos` and friends | Admin CRUD for all three levels, behind `authMiddleware`. |
| `PUT /api/cursos/:id/ordem` | Reorder. Takes an ordered id list per level, rewrites positions in one transaction. |

Public reads filter on `publicado = true` for the curso. Within a published
curso, unpublished aulas are returned as `{ id, titulo, publicado: false }` with
no slug, no duration and no body, so the syllabus can render an "em breve" row.
This deliberately exposes draft aula titles to the public. The alternative, a
bare "+3 aulas em breve" count, hides the shape of the course; if that tradeoff
is unwanted, it flips in one line of the tree query.

### Validation

New zod schemas for curso, módulo and aula. Two constraints inherited from the
existing code:

- `validate()` calls `parseAsync` and discards the result, so `req.body` reaches
  the controller unparsed. Any `.transform()` in a new schema would be dead code.
  Normalize in the controller or the service instead.
- Nullable columns (`video_id`, `duracao_seg`, `resumo`, `ementa`, `image_url`)
  need `.nullish()`, not `.optional()`, or a `null` sent by the admin form is
  rejected.

`video_id` accepts whatever the author pastes: a `watch?v=` URL, a `youtu.be`
link, an `/embed/` or `/shorts/` path, or the bare id. A zod `.refine()` rejects
anything with no recognizable id in it, and the controller converts what survives
to the 11-character id before it reaches the database. The refine runs at parse
time so it is not lost the way a `.transform()` would be. The admin form parses
the same shapes locally, but only to show a live preview: the backend decides
what gets stored.

## Frontend

### Routes

| Path | Page |
|---|---|
| `/cursos` | index, mock C |
| `/cursos/:cursoSlug` | syllabus, mock E |
| `/cursos/:cursoSlug/:aulaSlug` | aula, mock F |

Cursos uses slugs throughout. Educação uses ids (`/educacao/:id`); this is a
deliberate divergence, not an inconsistency to fix here.

`Cursos` is added to `menuItems` in `App.tsx` between Educação and Blog.

### Pages

**Index (C).** A resume panel renders above the index rows only when
`localStorage` holds an in-progress course, so a first visit sees a plain index.
Rows carry titulo, descrição, nível, aula count, duração and a progress bar.

**Syllabus (E).** Left column: ementa, then módulos as titled blocks with aula
rows (número, glyph for video or reading, título, duração, tick when done).
Right column: a sticky blueprint panel with the progress bar, a resume button,
and the metadata list, plus a second panel listing the course's wiki terms.

**Aula (F).** A fixed left spine holds the entire course tree with the current
aula marked. Main column: breadcrumb, "aula 7 de 15", title, the YouTube embed
in a `BlueprintFrame`, a mark-as-complete control, the Lexical body, and
previous/next. Below the `md` breakpoint the spine collapses into a drawer, the
same `Drawer` pattern the header already uses on mobile.

Reuse rather than rebuild: `BlueprintFrame`, `DuotonePhoto`, `CardGridSkeleton`,
`DetailPageSkeleton`, `RevealOnLoad`, `LexicalContent`, `useWikiGlossary`,
`WikiPopover`, `ShareAndCite`, `Pager`, `usePagedFilter`.

### Progress

One `localStorage` key, `opensilicio-cursos-progresso`, matching the existing
`opensilicio-theme-mode` convention.

```ts
type EstadoAula = 'concluida' | 'nao-concluida'

type ProgressoCurso = {
  aulas: Record<string, EstadoAula>  // chaveado pelo slug da aula
  ultima: string | null              // slug da última aula aberta
}

type Progresso = Record<string, ProgressoCurso>  // chaveado pelo slug do curso
```

The single map handles both completion modes without a second structure:

- **Automatic**: an `IntersectionObserver` on a sentinel at the foot of the aula
  body writes `'concluida'` only when the key is absent. It never overwrites an
  explicit choice.
- **Manual**: the button writes `'concluida'` or `'nao-concluida'` explicitly.
  Un-marking stores `'nao-concluida'`, which permanently blocks the automatic
  path for that aula. Without this, un-marking would be undone by the next scroll.

Video aulas use the same scroll sentinel. Waiting for playback to end would
require the YouTube iframe API, an external script for one small signal.

The denominator counts published aulas only, so "em breve" rows never make 100%
unreachable, and publishing a new aula moves the percentage down. That is
honest: the course did get longer.

All reads and writes are wrapped in `try/catch` like `getInitialMode` in
`App.tsx`, and a parsed value that does not match the shape is discarded rather
than trusted. Every screen renders correctly at zero progress.

Accepted consequences: progress does not follow a reader across devices, a
cleared browser wipes it, and no completion data reaches the server, so there
are no analytics on which aulas get finished.

The module is a pure reducer over `Progresso` plus a thin `useProgresso` hook,
so the logic is unit-testable without a DOM.

## Integration with what already exists

### Educação

`Educacao.tsx` gains a `Cursos` kind in its filter row. Each published curso
appears as one card linking to `/cursos/:slug`. Individual aulas never render as
cards there.

The page currently maps `EducationResource` straight into the grid. It will
fetch both sources in parallel and normalize:

```ts
type CartaoEducacao = {
  chave: string
  href: string
  titulo: string
  descricao: string
  imagem?: string
  categoria: Kind
  nivel?: string
  meta: string        // "4 módulos · 15 aulas · 3h20" ou "Atualizado 12/08/2026"
  buscavel: string    // haystack: título, descrição e, para cursos, os títulos das aulas
}
```

Two adapters, `cartaoDeCurso` and `cartaoDeRecurso`, feed one grid. The union
stays at the edge instead of spreading through the component. `buscavel` is why
`GET /api/cursos` returns `aulas_publicadas`: searching Educação for "Yosys"
finds the curso whose aula covers it, which is what "aulas reachable via search"
has to mean once aulas are not cards.

That field carries the slug alongside the title, rather than titles alone as
first drafted. The index draws a progress bar per curso, and progress is keyed
by aula slug, so without the slugs the bar could not be computed without opening
every course.

### Wiki, forward direction

An aula body should carry wiki terms exactly as a post or a resource does. The
`'blog' | 'education'` literal appears in five places, all of which widen to
include `'curso_aula'`. Migration `015_wiki_links_curso_aula.sql`:

```sql
ALTER TABLE content_wiki_links DROP CONSTRAINT IF EXISTS content_wiki_links_content_type_check;
ALTER TABLE content_wiki_links ADD CONSTRAINT content_wiki_links_content_type_check
    CHECK (content_type IN ('blog', 'education', 'curso_aula'));

ALTER TABLE pending_wiki_links DROP CONSTRAINT IF EXISTS pending_wiki_links_content_type_check;
ALTER TABLE pending_wiki_links ADD CONSTRAINT pending_wiki_links_content_type_check
    CHECK (content_type IN ('blog', 'education', 'curso_aula'));
```

Then:

- `validation.ts`, the `contentType` enum in `wikiLinkSchema`, and its error message
- `PendingWikiLinksService`: the TS union, plus the title-resolution query, which
  needs a third `LEFT JOIN` on `curso_aulas` and a third `WHEN` in its `CASE`
- `types/index.ts`: `WikiLink.content_type` and `PendingWikiLink.content_type`

`WikiLinkInserter` and `useWikiGlossary` then work in an aula unchanged.

### Wiki, reverse direction

The chosen discoverability option promises that a wiki term shows where it
appears. **This does not exist today for any content type.** `WikiDetail.tsx`
renders no backlinks, and the only link endpoint is
`GET /api/wiki/links/:contentType/:contentId`, which goes content to terms.

Building it here is one endpoint and one panel, and the query is
content-type-agnostic, so blog and education get backlinks at the same time:

```
GET /api/wiki/:slug/aparicoes
  -> [{ content_type, content_id, titulo, href, contexto }]
```

rendered as an "Onde aparece" blueprint panel on the wiki detail page. It is
called out separately because it is a wiki feature that Cursos triggers rather
than a part of Cursos, and it is the cleanest thing to cut if this needs to ship
smaller.

### Lexical

The aula body registers `LEXICAL_NODES` unchanged, so YouTube embeds, WaveDrom,
seven-segment displays and equations all work in aulas from the first commit.
The editor and the read-only renderer must register the identical set, as
everywhere else.

The aula's first-class video renders outside Lexical, as its own
`youtube-nocookie` iframe in a `BlueprintFrame`. Same host as `YouTubeNode`, so
cookie consent is unaffected.

## Admin

A `Cursos` section in `AdminLayout`, mirroring the existing list-plus-form shape.

| Route | Screen |
|---|---|
| `/admin/cursos` | list with publicado state, aula counts |
| `/admin/cursos/novo`, `/admin/cursos/:id` | curso metadata: título, slug, descrição, nível, capa via `ThumbnailUploadField`, ementa in a Lexical editor, publicado |
| `/admin/cursos/:id/estrutura` | the outline: add, rename, reorder and delete módulos and aulas; each aula links to its editor |
| `/admin/cursos/:id/aulas/:aulaId` | aula: título, slug, vídeo, duração as `mm:ss`, publicado, Lexical body, `WikiLinkInserter` |

The editor pitfalls in `CLAUDE.md` apply without change: never inject nodes into
the contenteditable, Salvar is the only write path, `setEditorState` does not
fire `OnChangePlugin`, and a code block with no language silently becomes
javascript.

Deleting a curso destroys every aula body under it through the cascade. That
action requires typing the course title to confirm, not a single click.

## Out of scope

Certificates, quizzes and exercises, enrollment or accounts, server-side
progress, completion analytics, self-hosted or Vimeo video, comments, and moving
the existing Educação trilha into a curso.

## Testing

Focused tests, in the style of the existing `parsePagination` and
`WikiLinkNode` suites.

**Backend (Jest, `src/tests/integration/`)**
- Curso CRUD, and that the tree endpoint returns módulos and aulas in `ordem`.
- An unpublished curso is absent from the public list.
- A published curso returns unpublished aulas without slug, duration or body.
- The reorder endpoint rewrites positions and is atomic on failure.
- The composite foreign key rejects an aula whose `curso_id` disagrees with its
  módulo. This is the constraint the whole shape rests on.
- A wiki link with `content_type = 'curso_aula'` is accepted after migration 015.

**Frontend (Vitest)**
- The progress reducer: automatic marking writes only when the key is absent;
  un-marking blocks a later automatic mark; malformed stored JSON is discarded.
- `mm:ss` parsing and formatting, both directions.
- YouTube id extraction from the URL forms an author actually pastes
  (`watch?v=`, `youtu.be/`, `/embed/`, bare id) and rejection of everything else.
- The two card adapters produce the same `CartaoEducacao` shape.

No snapshot tests of whole pages, and no test that only restates the type system.

## Risks and notes

- **Production deploys on push to `main`**, and the workflow runs pending
  migrations. Both migrations are additive and idempotent, but they run against
  production the moment this merges.
- Run migrations with `npx ts-node src/migrations/migrate.ts`, never
  `npm run migrate`, which prefers a stale compiled `dist/`.
- Widening the two CHECK constraints assumes PostgreSQL's default constraint
  names from migrations 001 and 007, which are unnamed inline checks. Verify
  with `\d content_wiki_links` before running against production.
- Progress in `localStorage` is per browser and invisible to the author.
- Publishing an aula lowers every reader's completion percentage.

## Build order

1. Migrations 014 and 015, verified locally.
2. `CursoService`, controller, routes, zod schemas, backend tests.
3. Public pages: index, syllabus, aula, with progress stubbed at zero.
4. The progress module and its tests, then wire it into the three pages.
5. Admin: list, curso form, structure outline, aula form.
6. Educação integration: the `Cursos` filter and the card adapters.
7. Wiki: constraint widening consumers, then the "Onde aparece" panel.
