# Course Quizzes Implementation Plan

> **For the implementing agent:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class, single-choice quizzes to Cursos, count passed quizzes in local progress, deploy the feature, then create the three module 2 quizzes as unpublished course content.

**Architecture:** PostgreSQL stores quiz definitions under a course module and optionally an aula. The public API returns correct alternatives because grading and progress live entirely in the browser. Focused frontend modules combine aulas and quizzes into one ordered activity stream, while the existing aula data shape remains intact.

**Tech Stack:** PostgreSQL 16, Express 4, TypeScript 5, Zod 3, React 19, React Router 7, MUI 7, Vitest, Jest, Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-20-quizzes-design.md`

## Global constraints

- A quiz has four alternatives per question and exactly one correct alternative.
- Attempts are unlimited. The default passing score is 70%, and equality passes.
- A failed quiz never blocks navigation.
- Published quizzes count in course progress; draft quizzes do not.
- Attempts, best score, and completion stay in `opensilicio-cursos-progresso`; no attempt is sent to the backend.
- Existing aula progress must migrate without loss.
- A new quiz defaults to draft. The production quiz records created after deploy stay draft for Paulo's review.
- Quiz questions use plain text in this version. No new product dependency is allowed.
- Keep strict TypeScript and `exactOptionalPropertyTypes`; do not use `any`.
- Register fixed `/quizzes/` API and page routes before dynamic slug routes.
- Public list failures render `ErroAoCarregar`, not an empty result.
- Dark mode uses true black `#000`; reuse Industry design-system rules and square corners.
- Animate only `transform` and `opacity`, and honor `prefers-reduced-motion`.
- Frontend verification requires `npm run typecheck`; `vite build` alone is insufficient.
- Do not rely on the currently broken repo-wide ESLint parser as the release gate.
- Do not push until the branch is rebased onto the latest `origin/main` and all release checks pass after the rebase.
- Pushing `main` deploys production. Watch the deployment, confirm the backup size is plausible, then verify the live site before authoring quiz records.
- Never stage the local `.superpowers/` mock directory.

## Review focus

- A quiz cannot point at an aula from another course or module; the database and an integration test must reject it.
- Legacy `localStorage` with `ultima` as a string must migrate to a typed aula activity while preserving explicit completion choices.
- A score of exactly the threshold passes, a later lower score cannot undo completion, and changing the threshold re-evaluates stored best score.
- Blank questions count as wrong only after the user confirms finalization; an abandoned attempt does not increment attempts.
- Deleting an associated aula must move the quiz to the module end and unpublish it in the same transaction.

---

### Task 1: Create the quiz schema and relational guarantees

**Files:**
- Create: `backend/src/migrations/017_curso_quizzes.sql`
- Modify: `backend/src/tests/integration/cursos.test.ts`

**Interfaces:**
- Consumes: `cursos`, `curso_modulos`, and `curso_aulas` from migrations 014 and 016.
- Produces: `curso_quizzes`, `curso_quiz_questoes`, `curso_quiz_alternativas`, and the unique aula key `(curso_id, modulo_id, id)`.

- [ ] **Step 1: Add a failing integrity test for cross-course aula association**

Add a test under `describe('integridade da estrutura')` that first tries to query `curso_quizzes` and then inserts a quiz whose `curso_id` and `modulo_id` come from one course while `aula_id` comes from another:

```ts
await expect(
  testPool.query(
    `INSERT INTO curso_quizzes
       (curso_id, modulo_id, aula_id, slug, titulo)
     VALUES ($1, $2, $3, 'quiz-intruso', 'Quiz intruso')`,
    [a.curso.id, a.modulo.id, b.aulas[0].id],
  ),
).rejects.toThrow();
```

- [ ] **Step 2: Run the focused backend test and verify the missing table failure**

Run:

```bash
cd backend
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test -- --runTestsByPath src/tests/integration/cursos.test.ts
```

Expected: FAIL because `curso_quizzes` does not exist.

- [ ] **Step 3: Create migration 017**

Use this shape, including the partial unique indexes:

```sql
ALTER TABLE curso_aulas
    ADD CONSTRAINT curso_aulas_curso_modulo_id_unique
    UNIQUE (curso_id, modulo_id, id);

CREATE TABLE curso_quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id UUID NOT NULL,
    modulo_id UUID NOT NULL,
    aula_id UUID,
    ordem INTEGER NOT NULL DEFAULT 0,
    slug VARCHAR(255) NOT NULL,
    titulo VARCHAR(500) NOT NULL,
    nota_minima INTEGER NOT NULL DEFAULT 70 CHECK (nota_minima BETWEEN 0 AND 100),
    publicado BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id, modulo_id)
      REFERENCES curso_modulos (curso_id, id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id, modulo_id, aula_id)
      REFERENCES curso_aulas (curso_id, modulo_id, id),
    UNIQUE (curso_id, slug)
);

CREATE UNIQUE INDEX curso_quizzes_uma_por_aula
    ON curso_quizzes (aula_id) WHERE aula_id IS NOT NULL;
CREATE UNIQUE INDEX curso_quizzes_um_final_por_modulo
    ON curso_quizzes (modulo_id) WHERE aula_id IS NULL;
CREATE INDEX curso_quizzes_curso_publicado
    ON curso_quizzes (curso_id, publicado);

CREATE TABLE curso_quiz_questoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id UUID NOT NULL REFERENCES curso_quizzes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    explicacao TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE curso_quiz_alternativas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id UUID NOT NULL REFERENCES curso_quiz_questoes(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    texto TEXT NOT NULL,
    correta BOOLEAN NOT NULL DEFAULT false
);

CREATE UNIQUE INDEX curso_quiz_uma_correta
    ON curso_quiz_alternativas (questao_id) WHERE correta;
```

Guard the added constraint through a `DO $$` block that checks `pg_constraint`, so a partially applied development database can rerun the migration safely.

- [ ] **Step 4: Run migration 017 with the TypeScript runner**

Run:

```bash
cd backend
DATABASE_URL="$TEST_DATABASE_URL" npx ts-node src/migrations/migrate.ts
```

Expected: `017_curso_quizzes.sql` is applied once.

- [ ] **Step 5: Add database tests for position and answer guarantees**

Test these cases directly through `testPool`:

```ts
await expect(criarSegundoQuizNaMesmaAula()).rejects.toThrow();
await expect(criarSegundoQuizFinalNoModulo()).rejects.toThrow();
await expect(marcarDuasAlternativasCorretas()).rejects.toThrow();
```

- [ ] **Step 6: Run the focused integration suite**

Run the command from Step 2.

Expected: PASS.

- [ ] **Step 7: Commit the schema**

```bash
git add backend/src/migrations/017_curso_quizzes.sql backend/src/tests/integration/cursos.test.ts
git commit -m "feat(cursos): add quiz schema"
```

### Task 2: Add the backend quiz service and CRUD API

**Files:**
- Create: `backend/src/services/CursoQuizService.ts`
- Create: `backend/src/controllers/cursoQuizController.ts`
- Create: `backend/src/tests/integration/cursoQuizzes.test.ts`
- Modify: `backend/src/middleware/validation.ts`
- Modify: `backend/src/routes/cursos.ts`
- Modify: `backend/src/services/CursoService.ts`

**Interfaces:**
- Consumes: tables from Task 1, `authMiddleware`, `validate`, `BadRequestError`, and `NotFoundError`.
- Produces: `cursoQuizService`, `QuizCompleto`, `QuizInput`, authenticated CRUD routes, and public `GET /api/cursos/:cursoSlug/quizzes/:quizSlug`.

- [ ] **Step 1: Write failing CRUD integration tests**

Create `cursoQuizzes.test.ts` with a course and aula fixture, then test:

```ts
const quiz = {
  modulo_id: modulo.id,
  aula_id: aula.id,
  slug: 'quiz-celulas-padrao',
  titulo: 'Quiz: células padrão',
  nota_minima: 70,
  publicado: false,
  questoes: [{
    enunciado: 'O que caracteriza uma célula padrão?',
    explicacao: 'A biblioteca fixa altura e trilhos de alimentação.',
    alternativas: [
      { texto: 'Altura e trilhos padronizados', correta: true },
      { texto: 'Somente o nome', correta: false },
      { texto: 'Somente a cor', correta: false },
      { texto: 'Nenhuma regra física', correta: false },
    ],
  }],
};
```

Assert 401 without a token, 201 with a token, draft by default, 404 on the public route while draft, 200 after publishing, and nested question order.

- [ ] **Step 2: Run the new suite and verify route failures**

```bash
cd backend
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test -- --runTestsByPath src/tests/integration/cursoQuizzes.test.ts
```

Expected: FAIL with 404 because no quiz routes exist.

- [ ] **Step 3: Add Zod input schemas**

Add schemas with no transforms relied upon by controllers:

```ts
const quizAlternativaSchema = z.object({
  id: z.string().uuid().optional(),
  texto: z.string().trim().min(1),
  correta: z.boolean(),
});

const quizQuestaoSchema = z.object({
  id: z.string().uuid().optional(),
  enunciado: z.string().trim().min(1),
  explicacao: z.string().trim().min(1),
  alternativas: z.array(quizAlternativaSchema).length(4)
    .refine((itens) => itens.filter((item) => item.correta).length === 1),
});

export const quizSchema = z.object({
  modulo_id: z.string().uuid(),
  aula_id: z.string().uuid().nullish(),
  slug: z.string().trim().min(1).max(255),
  titulo: z.string().trim().min(1).max(500),
  nota_minima: z.number().int().min(0).max(100).optional(),
  publicado: z.boolean().optional(),
  questoes: z.array(quizQuestaoSchema).min(1),
});
```

`quizUpdateSchema` may be partial for metadata, but whenever `questoes` is present it validates the complete nested bank. The service applies `70` when `nota_minima` is absent; this must not rely on a discarded Zod default transform.

- [ ] **Step 4: Implement the focused quiz service**

Define these public types and methods in `CursoQuizService.ts`:

```ts
export interface QuizAlternativa { id: string; ordem: number; texto: string; correta: boolean }
export interface QuizQuestao { id: string; ordem: number; enunciado: string; explicacao: string; alternativas: QuizAlternativa[] }
export interface CursoQuiz { id: string; curso_id: string; modulo_id: string; aula_id: string | null; ordem: number; slug: string; titulo: string; nota_minima: number; publicado: boolean }
export interface QuizCompleto extends CursoQuiz { questoes: QuizQuestao[] }
export interface QuizInput { modulo_id: string; aula_id?: string | null; slug: string; titulo: string; nota_minima?: number; publicado?: boolean; questoes: Array<{ enunciado: string; explicacao: string; alternativas: Array<{ texto: string; correta: boolean }> }> }

getPublico(cursoSlug: string, quizSlug: string): Promise<QuizCompleto>
getById(id: string): Promise<QuizCompleto>
criar(cursoId: string, input: QuizInput): Promise<QuizCompleto>
atualizar(id: string, input: Partial<QuizInput>): Promise<QuizCompleto>
deletar(id: string): Promise<void>
```

Use `pool.connect()`, `BEGIN`, replace nested questions on update, and `COMMIT` only after all four-alternative rows are inserted. Trim text explicitly in the controller because `validate()` discards Zod transforms.

- [ ] **Step 5: Implement controllers and register fixed routes first**

Register these before `/:slug`:

```ts
router.get('/quizzes/:id', authMiddleware, exigirUuid('id', 'Quiz'), getQuizById);
router.post('/:cursoId/modulos/:moduloId/quizzes', authMiddleware, exigirUuid('cursoId'), exigirUuid('moduloId', 'Módulo'), validate(quizSchema), criarQuiz);
router.put('/quizzes/:id', authMiddleware, exigirUuid('id', 'Quiz'), validate(quizUpdateSchema), atualizarQuiz);
router.delete('/quizzes/:id', authMiddleware, exigirUuid('id', 'Quiz'), deletarQuiz);
router.get('/:slug/quizzes/:quizSlug', cacheMiddleware({ ttl: 120 }), getQuiz);
```

The create controller takes `modulo_id` from the path, rejects a conflicting body value, normalizes whitespace, and clears `GET:/api/cursos` cache after writes.

- [ ] **Step 6: Make aula deletion relocate its quiz atomically**

Change `CursoService.deletarAula` to use a client transaction:

```sql
UPDATE curso_quizzes
   SET aula_id = NULL, publicado = false, updated_at = NOW()
 WHERE aula_id = $1;
DELETE FROM curso_aulas WHERE id = $1 RETURNING id;
```

Add an integration test that verifies both statements roll back if deletion fails and that a successful deletion leaves the quiz at module end as draft.

- [ ] **Step 7: Run backend quiz and course suites**

```bash
cd backend
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test -- --runTestsByPath src/tests/integration/cursoQuizzes.test.ts src/tests/integration/cursos.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit CRUD**

```bash
git add backend/src/services/CursoQuizService.ts backend/src/controllers/cursoQuizController.ts backend/src/middleware/validation.ts backend/src/routes/cursos.ts backend/src/services/CursoService.ts backend/src/tests/integration/cursoQuizzes.test.ts
git commit -m "feat(cursos): add quiz API"
```

### Task 3: Put quizzes into course trees, list aggregates, and activity neighbors

**Files:**
- Modify: `backend/src/services/CursoService.ts`
- Modify: `backend/src/services/CursoQuizService.ts`
- Modify: `backend/src/tests/integration/cursos.test.ts`
- Modify: `backend/src/tests/integration/cursoQuizzes.test.ts`

**Interfaces:**
- Consumes: `CursoQuiz` and nested quiz counts from Task 2.
- Produces: `QuizNaArvore`, `quizzes` on each module, `quizzes_publicados` in the course list, and typed activity neighbors.

- [ ] **Step 1: Add failing public tree and aggregate tests**

Assert that a public tree returns:

```ts
expect(modulo.quizzes).toEqual([
  { publicado: true, id: expect.any(String), aula_id: aula.id, slug: 'quiz-a', titulo: 'Quiz A', nota_minima: 70, total_questoes: 4 },
  { publicado: false, id: expect.any(String), titulo: 'Quiz em preparo' },
]);
```

Assert the list response has `quizzes`, `quizzes_rascunho`, and ordered `quizzes_publicados`. The draft must not expose slug, attachment, threshold, or question count.

- [ ] **Step 2: Add quiz lateral aggregates and tree query**

Extend `CursoNaListagem` with:

```ts
quizzes: number;
quizzes_rascunho: number;
quizzes_publicados: Array<{ slug: string; titulo: string; aula_id: string | null; nota_minima: number }>;
```

Fetch quiz tree rows in the existing `Promise.all`, count questions with a grouped subquery, and build a `Map<string, QuizNaArvore[]>` by `modulo_id`.

- [ ] **Step 3: Introduce typed activity neighbors**

Replace aula-only neighbor types with:

```ts
export type VizinhaDeAtividade =
  | { tipo: 'aula'; slug: string; titulo: string }
  | { tipo: 'quiz'; slug: string; titulo: string };
```

Create one service helper that orders published aulas and quizzes by module order, aula order, and attachment. An attached quiz follows its aula; a module quiz follows the last aula. `getAula` and `getPublico` both use that helper.

- [ ] **Step 4: Test ordering across modules**

Create two modules with an attached quiz and a module-final quiz. Assert this sequence:

```ts
[
  ['aula', 'm1-a1'],
  ['quiz', 'quiz-m1-a1'],
  ['aula', 'm1-a2'],
  ['quiz', 'revisao-m1'],
  ['aula', 'm2-a1'],
]
```

- [ ] **Step 5: Run both integration suites and commit**

```bash
cd backend
TEST_DATABASE_URL="$TEST_DATABASE_URL" npm test -- --runTestsByPath src/tests/integration/cursos.test.ts src/tests/integration/cursoQuizzes.test.ts
git add src/services/CursoService.ts src/services/CursoQuizService.ts src/tests/integration/cursos.test.ts src/tests/integration/cursoQuizzes.test.ts
git commit -m "feat(cursos): include quizzes in course activity order"
```

### Task 4: Extend frontend types, activity ordering, and local progress

**Files:**
- Create: `openSilicioWebsite/src/utils/atividadesDeCurso.ts`
- Create: `openSilicioWebsite/src/utils/atividadesDeCurso.test.ts`
- Modify: `openSilicioWebsite/src/types/index.ts`
- Modify: `openSilicioWebsite/src/services/api.ts`
- Modify: `openSilicioWebsite/src/utils/progressoDeCurso.ts`
- Modify: `openSilicioWebsite/src/utils/progressoDeCurso.test.ts`
- Modify: `openSilicioWebsite/src/components/design/useProgressoDeCurso.ts`

**Interfaces:**
- Consumes: API shapes from Task 3.
- Produces: `AtividadePublicada`, `atividadesDoModulo`, `hrefDaAtividade`, typed `ultima`, quiz scoring state, and hook methods for quiz attempts.

- [ ] **Step 1: Write failing tests for activity order and routes**

Test that `atividadesDoModulo(modulo)` puts each attached quiz after its aula and a null `aula_id` quiz at the end. Test routes:

```ts
expect(hrefDaAtividade('projeto-digital', { tipo: 'quiz', slug: 'quiz-1' }))
  .toBe('/cursos/projeto-digital/quizzes/quiz-1');
expect(hrefDaAtividade('projeto-digital', { tipo: 'aula', slug: 'mosfet' }))
  .toBe('/cursos/projeto-digital/mosfet');
```

- [ ] **Step 2: Add frontend quiz and activity types**

Add discriminated public and draft quiz unions plus:

```ts
export type AtividadePublicada =
  | { tipo: 'aula'; slug: string; titulo: string; opcional: boolean; duracao_seg: number | null }
  | { tipo: 'quiz'; slug: string; titulo: string; nota_minima: number };

export interface QuizComVizinhas {
  quiz: QuizCompleto;
  curso: Pick<Curso, 'slug' | 'titulo'>;
  modulo: Pick<CursoModulo, 'id' | 'titulo'>;
  anterior: VizinhaDeAtividade | null;
  proxima: VizinhaDeAtividade | null;
}
```

Add `getQuiz`, `getQuizById`, `criarQuiz`, `atualizarQuiz`, and `deletarQuiz` to `cursosApi`.

- [ ] **Step 3: Implement and test legacy progress migration**

Change the course state to:

```ts
export interface ProgressoQuiz { melhorNota: number; tentativas: number }
export type UltimaAtividade = { tipo: 'aula' | 'quiz'; slug: string }
export interface ProgressoCurso {
  aulas: Record<string, EstadoAula>;
  quizzes: Record<string, ProgressoQuiz>;
  ultima: UltimaAtividade | null;
}
```

Test that `{ aulas: { pdk: 'concluida' }, ultima: 'pdk' }` becomes the same aula map, an empty quiz map, and `{ tipo: 'aula', slug: 'pdk' }`.

- [ ] **Step 4: Add pure quiz attempt and total functions**

Expose:

```ts
registrarTentativa(progresso, curso, quiz, nota): Progresso
quizConcluido(progresso, curso, quiz, notaMinima): boolean
melhorNota(progresso, curso, quiz): number | null
contarAtividadesConcluidas(progresso, curso, atividades): number
proximaAtividade(progresso, curso, atividades): AtividadePublicada | null
```

`registrarTentativa` uses `Math.max(old, nota)` and increments attempts. `quizConcluido` derives completion from best score and current threshold rather than persisting a stale boolean. A published quiz counts regardless of whether its associated aula is optional; only draft quizzes are excluded.

- [ ] **Step 5: Pin threshold and corruption edge cases**

Add tests for exactly 70 passing, 69 failing, a later 40 preserving a previous 80, changing threshold from 70 to 90 re-evaluating the stored 80, a malformed quiz record being discarded while aula progress survives, and `zerarCurso` removing both maps.

- [ ] **Step 6: Extend the hook**

Return these callbacks without embedding rule logic in React:

```ts
registrarResultado(curso: string, quiz: string, nota: number): void
notaDoQuiz(curso: string, quiz: string): number | null
tentativasDoQuiz(curso: string, quiz: string): number
quizEstaConcluido(curso: string, quiz: string, notaMinima: number): boolean
visitarAtividade(curso: string, atividade: UltimaAtividade): void
```

- [ ] **Step 7: Run focused frontend tests and commit**

```bash
cd openSilicioWebsite
npm run test -- src/utils/atividadesDeCurso.test.ts src/utils/progressoDeCurso.test.ts
git add src/types/index.ts src/services/api.ts src/utils/atividadesDeCurso.ts src/utils/atividadesDeCurso.test.ts src/utils/progressoDeCurso.ts src/utils/progressoDeCurso.test.ts src/components/design/useProgressoDeCurso.ts
git commit -m "feat(cursos): track quiz activity progress"
```

### Task 5: Build the public quiz station

**Files:**
- Create: `openSilicioWebsite/src/pages/Quiz.tsx`
- Create: `openSilicioWebsite/src/pages/Quiz.test.tsx`
- Create: `openSilicioWebsite/src/components/quiz/IndiceDoQuiz.tsx`
- Create: `openSilicioWebsite/src/components/quiz/QuestaoDoQuiz.tsx`
- Create: `openSilicioWebsite/src/utils/correcaoDeQuiz.ts`
- Create: `openSilicioWebsite/src/utils/correcaoDeQuiz.test.ts`
- Modify: `openSilicioWebsite/src/App.tsx`

**Interfaces:**
- Consumes: `cursosApi.getQuiz`, progress hook from Task 4, `ErroAoCarregar`, `DetailPageSkeleton`, and design-system CSS variables.
- Produces: public route `/cursos/:cursoSlug/quizzes/:quizSlug` and `corrigirQuiz`.

- [ ] **Step 1: Write scoring tests first**

Define and test:

```ts
export interface CorrecaoDoQuiz {
  acertos: number;
  total: number;
  nota: number;
  porQuestao: Array<{ questaoId: string; correta: boolean; alternativaCorretaId: string }>;
}

corrigirQuiz(questoes, respostas): CorrecaoDoQuiz
```

Compute `nota` as `Math.round((acertos / total) * 100)`. Assert four of four is 100, three of four is 75, an unanswered question is wrong, and zero questions returns 0 without dividing by zero.

- [ ] **Step 2: Write page interaction tests**

Mock `cursosApi.getQuiz` and assert:

1. the first question and four radios render;
2. choosing an answer and moving next preserves the selection;
3. finishing with blanks opens a confirmation showing the exact blank count;
4. cancel returns to editing without recording an attempt;
5. confirm renders score and explanations and calls `registrarResultado` once;
6. `Tentar novamente` clears answers but keeps the displayed best score;
7. API failure renders `ErroAoCarregar` with retry.

- [ ] **Step 3: Implement the mock A component split**

`IndiceDoQuiz` receives question ids, current id, answered ids, and optional correction. `QuestaoDoQuiz` renders a semantic `fieldset`, one radio group, and correction details only after submission. `Quiz.tsx` owns answers, current index, confirmation, and result.

Use square borders and the Industry tokens. On mobile, make the question index horizontally scrollable. Move focus to the question heading after index navigation and to the result heading after correction.

- [ ] **Step 4: Register the specific route before the aula route**

```tsx
<Route path="/cursos/:cursoSlug/quizzes/:quizSlug" element={<Container sx={{ py: 4 }}><Quiz /></Container>} />
<Route path="/cursos/:cursoSlug/:aulaSlug" element={<Container sx={{ py: 4 }}><Aula /></Container>} />
```

- [ ] **Step 5: Run page and scoring tests, then typecheck**

```bash
cd openSilicioWebsite
npm run test -- src/utils/correcaoDeQuiz.test.ts src/pages/Quiz.test.tsx
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit the public quiz page**

```bash
git add openSilicioWebsite/src/pages/Quiz.tsx openSilicioWebsite/src/pages/Quiz.test.tsx openSilicioWebsite/src/components/quiz openSilicioWebsite/src/utils/correcaoDeQuiz.ts openSilicioWebsite/src/utils/correcaoDeQuiz.test.ts openSilicioWebsite/src/App.tsx
git commit -m "feat(cursos): add public quiz station"
```

### Task 6: Integrate quizzes into course navigation and progress displays

**Files:**
- Create: `openSilicioWebsite/src/components/design/EspinhaDoCurso.tsx`
- Create: `openSilicioWebsite/src/components/design/ListaDeAtividades.tsx`
- Modify: `openSilicioWebsite/src/pages/Aula.tsx`
- Modify: `openSilicioWebsite/src/pages/Quiz.tsx`
- Modify: `openSilicioWebsite/src/pages/Curso.tsx`
- Modify: `openSilicioWebsite/src/pages/Cursos.tsx`
- Modify: `openSilicioWebsite/src/pages/Educacao.test.ts`
- Delete: `openSilicioWebsite/src/components/design/ListaDeAulas.tsx`

**Interfaces:**
- Consumes: activity order and typed routes from Task 4.
- Produces: one shared course spine and activity list for course, aula, and quiz pages.

- [ ] **Step 1: Add failing rendering tests for mixed activities**

In component tests, pass one published aula, its published quiz, a draft quiz, and a module-final quiz. Assert that rows appear in that order, draft has no link, aula numbering skips quizzes, and quiz status is `Pendente`, `Melhor nota: 50%`, or `Concluído: 75%` from supplied callbacks.

- [ ] **Step 2: Extract the aula spine into `EspinhaDoCurso`**

Move the existing collapsible module behavior out of `Aula.tsx`. Replace `aulaAtual?: string` with:

```ts
atividadeAtual?: { tipo: 'aula' | 'quiz'; slug: string };
```

Receive one progress adapter with aula completion and quiz result callbacks. Keep the current `details` state behavior and zero-progress control.

- [ ] **Step 3: Replace `ListaDeAulas` with `ListaDeAtividades`**

Render published quizzes with a question-mark glyph, no aula number, their best-note state, and `/quizzes/` route. Keep aula video/read glyphs and optional labels unchanged.

- [ ] **Step 4: Update course and index progress math**

Use `contarAtividadesConcluidas` and `proximaAtividade` everywhere. Keep remaining time as the sum of incomplete aula durations only. Rename visible totals from `Aulas` to `Atividades` where quizzes join the count, while retaining an explicit `X aulas` metadata line.

- [ ] **Step 5: Update typed previous and next links**

Both Aula and Quiz use `hrefDaAtividade`. An aula with an attached quiz points `Próxima` to that quiz. A quiz points to the following aula or module-final activity. Link labels use `Próximo quiz` only when the neighbor type is quiz; otherwise use `Próxima aula`.

- [ ] **Step 6: Run focused and full frontend tests**

```bash
cd openSilicioWebsite
npm run test -- src/utils/atividadesDeCurso.test.ts src/utils/progressoDeCurso.test.ts src/pages/Quiz.test.tsx src/pages/Educacao.test.ts
npm run typecheck
```

- [ ] **Step 7: Commit navigation integration**

```bash
git add openSilicioWebsite/src/components/design/EspinhaDoCurso.tsx openSilicioWebsite/src/components/design/ListaDeAtividades.tsx openSilicioWebsite/src/components/design/ListaDeAulas.tsx openSilicioWebsite/src/pages/Aula.tsx openSilicioWebsite/src/pages/Quiz.tsx openSilicioWebsite/src/pages/Curso.tsx openSilicioWebsite/src/pages/Cursos.tsx openSilicioWebsite/src/pages/Educacao.test.ts
git commit -m "feat(cursos): integrate quizzes into course progress"
```

### Task 7: Build the admin quiz editor and structure rows

**Files:**
- Create: `openSilicioWebsite/src/pages/admin/QuizForm.tsx`
- Create: `openSilicioWebsite/src/pages/admin/QuizForm.test.tsx`
- Create: `openSilicioWebsite/src/utils/quizForm.ts`
- Create: `openSilicioWebsite/src/utils/quizForm.test.ts`
- Modify: `openSilicioWebsite/src/pages/admin/CursoEstrutura.tsx`
- Modify: `openSilicioWebsite/src/App.tsx`

**Interfaces:**
- Consumes: admin API methods and types from Task 4.
- Produces: admin route `/admin/cursos/:cursoSlug/quizzes/:quizId`, nested quiz payload validation, and structure actions.

- [ ] **Step 1: Write form-state tests before UI**

In `quizForm.test.ts`, test a factory with four blank alternatives and validation errors keyed by stable question id:

```ts
validarQuiz(form): Record<string, string>
novoRascunhoDeQuestao(): QuestaoDoFormulario
paraPayload(form): QuizInput
```

Pin blank title, duplicate slug handling from API, missing explanation, not exactly four filled alternatives, zero or two correct alternatives, and a valid 70% payload.

- [ ] **Step 2: Write editor interaction tests**

Assert adding a question selects it, switching questions preserves unsaved text, reordering changes payload order, removing prompts before data loss, draft save works with complete questions, and publishing is disabled while validation errors exist.

- [ ] **Step 3: Implement the selected station editor**

Use a two-column grid. Left side lists numbered questions with add, move, and delete actions. Right side has enunciado, four alternative text fields with radio selection, and required explanation. Metadata above the grid includes title, slug, placement, threshold, and publication.

The placement control uses:

```ts
type PosicaoQuiz =
  | { tipo: 'depois-da-aula'; aulaId: string }
  | { tipo: 'fim-do-modulo' };
```

Convert this to `aula_id` in `paraPayload`.

- [ ] **Step 4: Register admin routes**

Add both new and edit paths using the existing `ProtectedRoute` and `AdminLayout` pattern:

```tsx
/admin/cursos/:cursoSlug/quizzes/novo?modulo=:moduloId
/admin/cursos/:cursoSlug/quizzes/:quizId
```

- [ ] **Step 5: Add quiz rows and actions to `CursoEstrutura`**

Combine module activities for display. Add `Novo quiz`, edit, and delete controls. Show question count, threshold, placement, and publication chip. Deleting uses the same confirmation style as aula deletion. Do not change `Publicar módulo`; quiz publication remains explicit in `QuizForm`.

- [ ] **Step 6: Run admin tests and typecheck**

```bash
cd openSilicioWebsite
npm run test -- src/utils/quizForm.test.ts src/pages/admin/QuizForm.test.tsx
npm run typecheck
```

- [ ] **Step 7: Commit admin authoring**

```bash
git add openSilicioWebsite/src/pages/admin/QuizForm.tsx openSilicioWebsite/src/pages/admin/QuizForm.test.tsx openSilicioWebsite/src/utils/quizForm.ts openSilicioWebsite/src/utils/quizForm.test.ts openSilicioWebsite/src/pages/admin/CursoEstrutura.tsx openSilicioWebsite/src/App.tsx
git commit -m "feat(admin): add course quiz editor"
```

### Task 8: Run release verification and deploy production

**Files:**
- Modify only if verification finds a real defect in quiz code.

**Interfaces:**
- Consumes: all code from Tasks 1 through 7.
- Produces: verified `main`, completed GitHub Actions deployment, live quiz feature with no quiz records yet.

- [ ] **Step 1: Start a disposable Postgres and run all migrations**

Use an unused local port and explicit container name. Run migrations with the TypeScript runner, not `npm run migrate`:

```bash
docker run --name opensilicio-quiz-test -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=opensilicio_test -p 55433:5432 -d postgres:16-alpine
cd backend
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55433/opensilicio_test npx ts-node src/migrations/migrate.ts
```

- [ ] **Step 2: Run backend checks**

```bash
cd backend
TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55433/opensilicio_test npm test
npm run build
```

Expected: all Jest suites pass and `tsc` exits 0.

- [ ] **Step 3: Run frontend checks**

```bash
cd openSilicioWebsite
npm run test
npm run typecheck
npm run build
```

Expected: all Vitest suites pass, typecheck exits 0, and Vite builds.

- [ ] **Step 4: Inspect the branch diff and run a focused review**

```bash
git diff origin/main...HEAD --check
git diff --stat origin/main...HEAD
```

Review schema safety, authenticated routes, public draft filtering, localStorage migration, accessibility, and scope against the spec.

- [ ] **Step 5: Rebase onto the latest production branch**

```bash
git fetch origin main
git rebase origin/main
```

Resolve only conflicts in planned files. Re-run Steps 2 and 3 after the rebase.

- [ ] **Step 6: Commit any verification fixes**

If fixes exist, inspect `git status --short`, stage each changed quiz path explicitly, and never use `git add .`. Commit them with `git commit -m "fix(cursos): correct quiz release checks"`.

- [ ] **Step 7: Push `main` and watch deployment**

```bash
git push origin main
gh run watch --exit-status
```

Confirm the deploy log created a database backup with a plausible size near the recent baseline, applied migration 017, and restarted frontend and backend successfully.

- [ ] **Step 8: Verify production read paths before creating data**

Check:

```text
https://opensilicio.com.br/cursos
https://opensilicio.com.br/cursos/projeto-digital
https://opensilicio.com.br/admin/cursos/projeto-digital/estrutura
```

Verify existing aula progress still renders, draft quizzes are absent because none exist, and the admin exposes `Novo quiz`.

- [ ] **Step 9: Stop and remove only the disposable test database**

```bash
docker stop opensilicio-quiz-test
docker rm opensilicio-quiz-test
```

Report that the named disposable container was removed. Do not touch the project development database.

### Task 9: Adapt and create the module 2 quizzes as drafts

**Files:**
- Create locally, gitignored: `conteudo/cursos/projeto-digital/quiz-01-1-celulas-padrao.json`
- Create locally, gitignored: `conteudo/cursos/projeto-digital/quiz-01-3-mosfet-magic.json`
- Create locally, gitignored: `conteudo/cursos/projeto-digital/quiz-01-4-revisao-mosfets.json`

**Interfaces:**
- Consumes: live admin quiz editor from Task 8 and authorized Z2A course access.
- Produces: three unpublished quiz records in module 2, linked to the correct positions.

- [ ] **Step 1: Read the three Z2A quizzes without submitting answers**

Use the already logged-in browser to inspect:

- Quiz for 1.1, after `Simulando uma célula padrão`;
- Quiz for 1.3, after `Desenhando um MOSFET no Magic`;
- Quiz for Topic 1, at the end of module 2.

Do not finish attempts or mark source lessons complete. If a prerequisite prevents reading a quiz, pause and ask Paulo to unlock it.

- [ ] **Step 2: Write adapted Portuguese source files**

Use this exact JSON shape:

```json
{
  "titulo": "Quiz: células padrão e simulação",
  "slug": "quiz-celulas-padrao-e-simulacao",
  "nota_minima": 70,
  "posicao": { "tipo": "depois-da-aula", "aula_slug": "simulando-uma-celula-padrao" },
  "questoes": [
    {
      "enunciado": "Qual ordem de grandeza descreve melhor a quantidade de funções lógicas distintas em uma biblioteca digital de alta densidade, sem contar variações de capacidade de acionamento?",
      "explicacao": "Uma biblioteca típica reúne aproximadamente uma centena de funções distintas; as variantes de acionamento ampliam o total de células disponíveis.",
      "alternativas": [
        { "texto": "Cerca de 100", "correta": true },
        { "texto": "Cerca de 10", "correta": false },
        { "texto": "Cerca de 1.000", "correta": false },
        { "texto": "Cerca de 10.000", "correta": false }
      ]
    }
  ]
}
```

Preserve the concept, correct answer, distractor logic, and order. Rewrite wording in Portuguese and add a short explanation grounded in our aula. Validate each file with `jq` and confirm every question has four alternatives and one correct answer.

- [ ] **Step 3: Create the three records through the real production admin UI**

For each quiz, choose the specified placement, fill the complete question bank, leave `Publicado` off, and click `Salvar`. The source JSON remains the local authoring record.

- [ ] **Step 4: Verify each saved record from stored state**

Reload every quiz editor and confirm title, slug, position, threshold, question order, correct radio, explanations, and draft switch. Then reload the course structure and verify this order:

```text
Simulando uma célula padrão
Quiz: células padrão e simulação
Desenhando componentes no SiliWiz
Desenhando um MOSFET no Magic
Quiz: MOSFET no Magic
Do NMOS ao CMOS
Quiz: revisão de MOSFETs e CMOS
```

- [ ] **Step 5: Verify public draft behavior**

Open the public course page. Each quiz title may appear as `em breve`, but no quiz may expose a URL, questions, threshold, or add to the progress denominator while draft.

- [ ] **Step 6: Report completion**

Report the deployment run, production verification, created draft quiz titles and positions, tests run, and any source quiz that remained blocked. Do not publish quiz content without Paulo's later review.
