# OpenSilício Website

The website for OpenSilício, a USP (Escola Politécnica) research/extension
group on open microelectronics. It serves a public blog, an "Educação"
resource library (guides/projects/tutorials/theory), and a cross-linked wiki
of technical terms, plus an admin panel for authoring all of it.

## Stack & layout

- `openSilicioWebsite/` — frontend: React 19, Vite 5, MUI 7, React Router 7,
  Lexical 0.37 (rich text editor), framer-motion (interaction/animation).
- `backend/` — Node.js + Express + PostgreSQL, JWT auth.
- `docker/` — dev and prod Docker Compose setups.
- `.github/workflows/deploy.yml` — pushing to `main` deploys straight to the
  production VPS (see **Deployment** below).
- `README/` — deeper docs (deployment, scripts, dev setup, data safety).
  `README.md` at the repo root is the quick-start entry point.

## Local development

Use `scripts/dev/start.sh` (or `.bat` on Windows) to bring up Postgres +
backend + frontend in Docker with hot reload. The READMEs still say
`scripts/development/`; the folder is `scripts/dev/`. See `README.md` /
`README/DEVELOPMENT_GUIDE.md` for the full setup, local admin credentials,
and non-Docker alternatives.

- **It needs a `.env` at the repo root**, which is gitignored; copy
  `.env.example`. Without it neither the script nor the compose file starts.
- **`start.sh` begins with `down -v`, so every run wipes the local database**
  and reseeds the admin and settings. Local content does not survive a
  restart; use plain `docker-compose ... up -d` to keep it.
- **To look at a branch against real content without the stack**, run Vite
  with a temporary config that proxies `/api` and `/uploads` to the public
  site (`services/api.ts` uses `baseURL: '/api'`, so nothing else changes).
  Read-only GETs, a few page loads, and delete the config afterwards.
- **The backend Jest suite needs a Postgres** (`TEST_DATABASE_URL` or
  `DATABASE_URL`). A throwaway `postgres:16-alpine` container on a spare port,
  migrated with `npx ts-node src/migrations/migrate.ts`, is enough.

- Frontend: http://localhost:5173 — `npm run dev` / `npm run build` /
  `npm run typecheck` / `npm run test` (Vitest) / `npm run lint` inside
  `openSilicioWebsite/`. `npm run build` is `vite build`, which transpiles
  but does not typecheck — `npm run typecheck` (`tsc --noEmit`) is the only
  command that actually catches type errors on this app; a strict-mode
  error shipped through three code reviews before this was noticed. Note:
  ESLint's TS parsing is currently broken repo-wide — don't treat a failing
  `lint` run as a signal on code you touched unless you introduced the
  specific error.
- Backend: http://localhost:3001 — `npm run dev` / `npm run build` /
  `npm test` (Jest) inside `backend/`. Here `npm run build` is plain `tsc`,
  so it does typecheck.

### Database migrations

Add a new numbered `.sql` file under `backend/src/migrations/`. Run
migrations with `npx ts-node src/migrations/migrate.ts` directly rather than
`npm run migrate` — that script prefers a compiled `dist/migrations/migrate.js`
if one exists, which silently goes stale after a `tsc`/`build` and can look
like "0 pending migrations" even when your new migration hasn't run.

## Making changes

- **Design system**: the public site follows the "Industry" design system —
  steel-blue accent, Barlow/Barlow Condensed type, a blueprint/corner-mark
  motif, square corners everywhere. Tokens and patterns live in
  `openSilicioWebsite/src/styles/design-system/`; reusable pieces (frames,
  photos, skeletons, the wiki popover, etc.) live in
  `openSilicioWebsite/src/components/design/`. Reuse those instead of
  hand-rolling corner marks, hairline borders, or ad-hoc skeleton shimmer.
- **Dark mode**: driven by a `data-color-mode` attribute on `<html>` (see
  `App.tsx`/`theme.ts`), not just MUI's `theme.palette.mode` — plain-CSS
  design-system rules must also branch on `:root[data-color-mode="dark"]` to
  stay mode-aware.
- **Animation**: framer-motion is the standard for interactive motion.
  Prefer compositor-only properties (`transform`/`opacity`), respect
  `useReducedMotion()`, and keep it purposeful — feedback, spatial
  continuity, or preventing a jarring change, not decoration for its own
  sake. High-frequency UI (buttons, tags, filters used constantly) should
  stay fast and subtle.
- **TypeScript**: both apps run in strict mode; the frontend additionally
  enables `exactOptionalPropertyTypes`. Avoid `any`; prefer inferred/narrow
  types over hand-widened ones.
- Verify a change with the actual build/typecheck/test commands above (and
  the browser, for UI work) before considering it done — don't rely on
  `lint` alone given the current ESLint breakage, and on the frontend
  don't rely on `build` alone either, since it doesn't typecheck.

## The Lexical editor and the admin panel

Hard-won behaviour. Most of these fail silently, so assume them rather than
rediscovering them.

- **Never inject nodes into the contenteditable DOM.** Lexical removes foreign
  nodes and the two sides loop until the tab dies (this took production down
  once). Anything that must sit on top of the editor goes in an overlay layer —
  see the copy button in `styles/design-system/patterns/code.css`.
- **`setEditorState` does not fire `OnChangePlugin`.** The admin form's `content`
  state therefore stays stale, and clicking Salvar afterwards writes the
  *pre-mutation* state and silently reverts your change. Pasting does fire it, so
  clear-then-paste is safe; a mutation done only through `setEditorState` needs a
  real edit before saving.
- **The form has no autosave.** The Salvar submit button is the only reliable
  write path.
- **Lexical ignores selection set from a script**, so `document.execCommand`
  works or no-ops depending on Lexical's own internal selection. Don't rely on it
  for programmatic edits; it once left a stray character in a published post.
  Real key events work.
- **`LEXICAL_NODES` in `components/lexical/nodeSet.ts` is the single source of
  truth.** The editor and the read-only renderer must register the identical
  set, or content silently fails to render. Notably there is **no `TableNode`**:
  markdown tables are dropped on paste.
- **A code block with no language becomes `javascript`** in `@lexical/code`, and
  that choice is persisted — wrong label plus stray syntax colouring on terminal
  output. Use `plain` for anything that isn't really code.
- Two node importers are deliberately narrow, and widening them re-breaks
  content: `WikiLinkNode.importDOM` claims an anchor only when it carries the
  `wiki-link` class or a `/wiki/` href (otherwise `LinkNode` takes it), and the
  `$...$` equation transform skips code nodes and requires Pandoc-style
  delimiters so shell variables survive. Both have tests.
- **Category "Projetos" renders three editors** (Visão Geral, Recursos,
  Conteúdo); every other category renders one. Title, description, cover letter
  and the rest are form fields, not editor content, and they are React-controlled
  (set them with the native value setter plus an `input` event).
- **`AnatomiaNode` (`os-anatomia`) replaces ASCII leader-line diagrams.**
  Source is JSON5: `{ texto, partes: [{ trecho, nota }] }`. Each `trecho` is
  located in `texto` by plain substring search (`resolverPartes` in
  `components/lexical/utils/`), not by explicit index — so a `trecho` that
  also occurs elsewhere in `texto` (e.g. a bare `'1'` inside `'sky130'`) is
  rejected as ambiguous; give it more context instead (`'_1'`). Legend order
  follows the `partes` array, not left-to-right string position, so an
  author can explain a name back-to-front like the original sky130 post
  did. No SVG, no measured pixel positions — it's plain text that wraps.
- **`PwmLabNode` (`os-pwm-lab`) mantém o experimento dentro da aula.** A fonte
  é JSON5 e carrega de modo assíncrono; uma mudança de fonte invalida a carga
  anterior. A interação do aluno é transitória, não toca em progresso nem
  `localStorage`. `data-os-pwm-lab` vazio ainda importa um nó para o autor poder
  corrigir a configuração no editor.
- **Wiki term association lives in the `content_wiki_links` table**, and since
  `53324f5` the server derives it from the saved content: on every
  blog/education/curso-aula create or update it walks the Lexical JSON for
  `wikilink` nodes, resolves the slugs against `wiki_entries` and rewrites that
  content's rows in a transaction (`backend/src/services/wikiLinkSync.ts`). So
  pasting `<a href="/wiki/slug" class="wiki-link">term</a>` is enough to create
  the link, and deleting it from the text removes the chip. A slug with no
  matching entry is dropped silently, so check the row count after saving.
  `termos_wiki` in the content front matter is a to-do list for authors, not a
  source of truth. `content_type` is `'blog' | 'education' | 'curso_aula'`, and
  that literal lives in two CHECK constraints, the zod enum,
  `PendingWikiLinksService` and the frontend types, so a fourth content type has
  to widen all five.
- **The API authenticates with a Bearer token, not a cookie** — a cookie-only
  request gets `401 Token não fornecido`. Drive the real admin UI instead of
  reaching for the token.
- **Uploads accept jpeg/jpg/png/gif/webp/mp4/webm/ogg only; SVG is rejected.**
  The toolbar button opens a native file dialog, but `ImagePlugin` also handles
  `PASTE_COMMAND` with `clipboardData.files`.

## Cursos

The `/cursos` tab is a separate content type from Educação: `cursos` ->
`curso_modulos` -> `curso_aulas` (migrations 014 and 015). The design is in
`docs/superpowers/specs/2026-09-01-cursos-design.md`, and the UI mocks it was
built from are beside it in `2026-09-01-cursos-mocks.html`.

- **An aula's `curso_id` is denormalized but cannot drift.** A composite foreign
  key on `(curso_id, modulo_id)` makes the database reject any aula whose curso
  disagrees with its módulo's curso. Aula slugs are unique per *curso*, not per
  módulo, so an aula can move between módulos without changing its URL.
- **Video is a first-class field, not an embed in the body.** `video_id` holds
  the 11-character YouTube id; the player is built on `youtube-nocookie.com`,
  the same host `YouTubeNode` uses, so cookie consent is unaffected. The
  controller normalizes any YouTube URL shape down to the id.
- **A published curso can hold unpublished aulas.** The public tree returns them
  with a title but no slug, no duration and no body, and the syllabus draws an
  "em breve" row. They are excluded from the progress denominator, so publishing
  an aula lowers every reader's percentage.
- **Reader progress lives only in `localStorage`** under
  `opensilicio-cursos-progresso`, since visitors have no accounts. The rules are
  a pure module (`utils/progressoDeCurso.ts`) with tests; the hook only touches
  storage. Marking is automatic on reaching the foot of an aula *and* manual;
  un-marking stores `'nao-concluida'`, which is what stops the next scroll from
  re-marking it.
- **Auto-marking requires a scroll since the aula opened.** The sentinel sits
  under the Lexical body, which lays out a few frames late, so on a tall
  viewport it is briefly on screen and every aula used to be stored as
  concluída half a second after opening. `useAoChegarAoFim` records `scrollY`
  when the sentinel mounts and ignores intersections until the page has moved
  past it. It compares against the mount position, not zero, because **the app
  never resets scroll on a route change**: "Próxima" lands on the next aula
  already scrolled. An aula short enough to fit on screen therefore never
  auto-marks and uses the button, the same deal as a video-only aula. The bug
  only shows in real time; `--virtual-time-budget` skips the layout race.
- **"Zerar progresso" deletes the curso's whole key** (`zerarCurso`), `ultima`
  included, so `proximaAula` has no half-empty state to handle. The control
  shows only when `temProgressoGravado` finds an entry in `aulas`: opening an
  aula stores `ultima`, and that alone is nothing to erase. It lives in the
  espinha of the aula page and in the "Seu progresso" card.
- **The espinha folds per módulo** with native `<details>` whose `open` comes
  from a set in React state. Opening only ever adds to the set: navigating
  opens the current aula's módulo and leaves the reader's other choices alone.
  The módulo count includes `opcional` aulas, since it mirrors the list beneath
  it; the curso total above it goes through `contaveis()` and does not.
- **An `opcional` aula is published but outside the progress count** (migration
  016). It is for alternatives the reader picks one of — install on Windows,
  Linux or macOS — which otherwise make 100% unreachable. `contaveis()` in
  `utils/progressoDeCurso.ts` is the only place that knows the rule: it drops
  the optional aulas, and every total, remaining time and "first pending" search
  goes through it. An optional aula can still be marked and still shows its
  check; `total_aulas` and the syllabus numbering keep counting it.
- **Reordering rewrites the whole list** in one `unnest ... WITH ORDINALITY`
  update, so there is no half-reordered state. `ordem` has no unique constraint.

### Authoring course material

The first curso, "Projeto Digital" (`projeto-digital`), is the Portuguese version
of Matt Venn's Zero to ASIC, made with his permission. Paulo sends notes and
screenshots of the original one módulo at a time; we reconstruct each aula in
our own words and structure, and where the original and our Educação trilha
disagree, ours wins (on Windows the `.sh` scripts inside WSL, and our own pinned
`DOCKER_TAG`).

- **Sources live in `conteudo/cursos/<curso-slug>/`**, which is gitignored: one
  `.md` per aula, front matter `ordem`, `modulo`, `titulo`, `slug`, `video`,
  `opcional`, `termos_wiki`. `node build.js` in `conteudo/` writes the `.html`
  body beside each one and a card per aula in `conteudo/index.html`; a new curso
  needs its own entry in `SECOES`. Edit the `.md` first and rebuild, so the
  source always matches what is live.
- **Content goes in through the real admin UI in the browser**: `/admin/cursos`,
  then "Dados do curso" for título, slug, descrição, nível and the ementa,
  `/admin/cursos/<slug>/estrutura` for módulos, and "Nova aula" inside a módulo.
  Set text fields with the native value setter plus an `input` event. Put a body
  in by dispatching a `ClipboardEvent('paste')` carrying the generated HTML as
  `text/html` on the empty editor. To replace a body, first call
  `setEditorState` with an empty root on the element's `__lexicalEditor`, then
  paste: the paste is what fires `OnChangePlugin`.
- **Click Salvar by position from a fresh screenshot, after scrolling to the
  top.** A paste scrolls the form, element refs taken before it go stale, and
  the curso edit form has an "Estrutura" button right beside Salvar. A form with
  no pasted body saves with a scripted `.click()`.
- **Confirm every save against stored state.** A create form redirects to the
  new record's URL, and that redirect is the proof. The curso edit form gives no
  signal at all, so reload it in a second tab and read the editor back.
- **Módulos are numbered from 1 by `ordem`**, so name a módulo in prose ("o
  módulo de LibreLane") and the text survives a reorder.
- **A módulo shows "em breve" only through a draft aula.** An empty módulo
  renders "0 aulas", so each future módulo carries one draft placeholder aula,
  "Aulas em preparação", whose title is public.
- **Publishing is per record, except on the estrutura screen.** The curso's
  "Publicado" switch still sits at the foot of "Dados do curso", below the
  ementa, and each aula has its own. But "Estrutura" also carries a "Publicar
  curso"/"Despublicar curso" button in the header, beside the state chip, and a
  "Publicar módulo" button on every módulo that still has a rascunho, which
  publishes all of its draft aulas at once.
- **Check every internal link before saving.** Public routes are `/`, `/blog`,
  `/educacao`, `/cursos`, `/wiki` and `/sobre`; `GET /api/wiki?limit=200` lists
  the wiki slugs that exist.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which SSHes into
the production VPS and: backs up the Postgres database, pulls `main`,
rebuilds and restarts the Docker containers, then runs pending migrations.
This is a real, immediate production deploy with no staging step — treat a
push to `main` accordingly (verify the change locally first, watch the
Action run, and check the live site after).

- **The production site is https://opensilicio.com.br.** The deploy log's
  backup line is the quick health check: the dump has been about 2.4M, and a
  sudden drop means data went missing before the deploy, not because of it.
- **An "empty" site is usually the API failing, not data loss.** On
  2026-09-19 every `/api` route answered 429 and the list pages drew that as
  "nenhum ... encontrado". Public list pages now render `ErroAoCarregar`
  (`components/design/`) when the load fails; a new list page should do the
  same and keep its empty state for a genuinely empty response.
- **The rate limit is per visitor only because of `trust proxy`.** The host
  nginx proxies `/api` to the backend, so without it every request carries the
  proxy's IP and all visitors share one bucket. `server.ts` trusts
  `TRUST_PROXY_HOPS` hops, default 1; the host nginx config is not in this
  repo, so if one heavy reader locks everyone out again, try 2. Never `true`,
  which accepts a forged `X-Forwarded-For`. `apiLimiter` is 1000 per 15
  minutes because one curso page already fires a wiki request per aula;
  `createLimiter` (20 per hour) covers only `POST` on `/api/blog`,
  `/api/education`, `/api/wiki` and `/api/cursos`, not aulas or módulos. The
  counters live in memory, so restarting the backend clears a lockout.
