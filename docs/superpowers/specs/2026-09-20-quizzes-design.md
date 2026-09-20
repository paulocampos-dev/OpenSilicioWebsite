# Quizzes em Cursos: design

**Data:** 2026-09-20

**Status:** aprovado em conversa, aguardando revisão do documento

**Mock escolhido:** opção A, "Estação de trabalho"

## Resumo

Cursos passa a aceitar quizzes como atividades próprias. Um quiz pode aparecer
logo depois de uma aula ou no fim de um módulo. Ele tem página pública, estado de
publicação e editor administrativo próprios.

O aluno responde uma questão por vez, envia a tentativa inteira e recebe a
correção. Pode tentar novamente sem limite e abrir qualquer aula, mesmo sem
atingir a nota mínima. O navegador guarda tentativas e melhor nota. Não há conta
de aluno nem histórico de respostas no servidor.

Quizzes publicados entram na porcentagem do curso. Uma melhor nota de 70% ou
mais conclui o quiz por padrão. O autor pode alterar esse valor.

As perguntas do curso Projeto Digital preservam os conceitos, a ordem pedagógica
e as respostas dos quizzes do Zero to ASIC, usados com permissão no curso. A
redação e as explicações serão adaptadas ao português e ao material da
OpenSilício.

## Decisões

| Questão | Decisão |
|---|---|
| Relação com o curso | Conteúdo próprio, associado a módulo e opcionalmente a aula |
| Posição | Depois da aula associada ou no fim do módulo |
| Quantidade inicial | No máximo um quiz por aula e um quiz final por módulo |
| Tipo de questão | Escolha única, quatro alternativas, uma correta |
| Tentativas | Ilimitadas |
| Conclusão | Melhor nota igual ou maior que a nota mínima, 70% por padrão |
| Navegação | Nunca bloqueada por nota ou tentativa |
| Progresso | Aulas contáveis e quizzes publicados formam o denominador |
| Persistência do aluno | `localStorage`, sem conta e sem envio de tentativas |
| Correção | No navegador, após enviar a tentativa inteira |
| Interface pública | Mock A, índice lateral e uma questão por vez |
| Editor | Lista de questões à esquerda, questão selecionada à direita |
| Conteúdo | Texto simples na primeira versão |

## Escopo

### Incluído

- banco de dados, API pública e CRUD administrativo;
- quiz ligado a aula ou ao fim de módulo;
- rascunho e publicação independentes;
- quatro alternativas com escolha única;
- explicação por questão;
- correção, melhor nota, tentativas e conclusão no navegador;
- quiz no currículo, na espinha da aula e no cálculo de progresso;
- editor administrativo completo;
- perguntas adaptadas do Z2A para o módulo 2.

### Fora desta versão

- contas de aluno e sincronização entre dispositivos;
- relatório de respostas para administradores;
- limite de tentativas ou prazo;
- bloqueio de aulas;
- respostas múltiplas, texto livre, associação ou upload;
- sorteio de perguntas ou alternativas;
- banco reutilizável de questões entre quizzes;
- certificado, ranking ou nota final do curso;
- persistência de uma tentativa ainda não enviada.

## Modelo de dados

A migração seguinte à `016_aula_opcional.sql` cria três tabelas.

### `curso_quizzes`

```sql
CREATE TABLE curso_quizzes (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    curso_id     UUID NOT NULL,
    modulo_id    UUID NOT NULL,
    aula_id      UUID,
    ordem        INTEGER NOT NULL DEFAULT 0,
    slug         VARCHAR(255) NOT NULL,
    titulo       VARCHAR(500) NOT NULL,
    nota_minima  INTEGER NOT NULL DEFAULT 70
                 CHECK (nota_minima BETWEEN 0 AND 100),
    publicado    BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (curso_id, modulo_id)
        REFERENCES curso_modulos (curso_id, id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id, modulo_id, aula_id)
        REFERENCES curso_aulas (curso_id, modulo_id, id),
    UNIQUE (curso_id, slug)
);
```

`aula_id` aponta para uma aula do mesmo curso e módulo. A migração adiciona uma
chave única em `(curso_id, modulo_id, id)` a `curso_aulas`; o quiz usa essa chave
composta. A referência não apaga o quiz automaticamente. O serviço de exclusão
de aula primeiro remove a associação e despublica o quiz na mesma transação.

Dois índices únicos parciais aplicam a regra da primeira versão:

- um único quiz publicado ou rascunho por `aula_id` quando ela não é nula;
- um único quiz final por `modulo_id` quando `aula_id` é nula.

`ordem` mantém leitura estável e permite remover a limitação no futuro sem mudar
o formato dos dados. O editor desta versão não oferece múltiplos quizzes na
mesma posição.

### `curso_quiz_questoes`

```sql
CREATE TABLE curso_quiz_questoes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id     UUID NOT NULL REFERENCES curso_quizzes(id) ON DELETE CASCADE,
    ordem       INTEGER NOT NULL,
    enunciado   TEXT NOT NULL,
    explicacao  TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### `curso_quiz_alternativas`

```sql
CREATE TABLE curso_quiz_alternativas (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    questao_id  UUID NOT NULL
                REFERENCES curso_quiz_questoes(id) ON DELETE CASCADE,
    ordem       INTEGER NOT NULL,
    texto       TEXT NOT NULL,
    correta     BOOLEAN NOT NULL DEFAULT false
);
```

Um índice único parcial em `questao_id WHERE correta` impede duas alternativas
corretas. O serviço também exige quatro alternativas preenchidas e exatamente
uma correta, pois o índice não garante que alguma alternativa seja correta.

## Regras de posicionamento e ciclo de vida

- Quiz com `aula_id` aparece imediatamente depois daquela aula.
- Quiz sem `aula_id` aparece no fim do módulo.
- A primeira versão aceita um quiz em cada posição.
- O slug é único dentro do curso e a rota tem o segmento `/quizzes/`, então ele
  pode coincidir com o slug de uma aula sem colisão.
- Quiz novo começa como rascunho.
- Quiz em rascunho aparece no currículo como "em breve", sem slug, perguntas ou
  nota mínima. Ele não entra no progresso.
- Publicar exige ao menos uma questão. Todas as questões precisam ter enunciado,
  explicação, quatro alternativas e uma resposta correta.
- Excluir uma aula associada move o quiz para o fim do módulo e o transforma em
  rascunho. A operação acontece antes da exclusão da aula, na mesma transação.
- Excluir módulo ou curso remove seus quizzes, questões e alternativas por
  cascata.

## API

O CRUD segue a divisão atual entre controller fino, `CursoService` e schemas
zod em `validation.ts`.

As rotas administrativas iniciadas por `/quizzes/` são registradas antes das
rotas públicas com `/:cursoSlug`, para o parâmetro de curso não capturar o nome
fixo `quizzes`.

### Rotas públicas

| Rota | Resposta |
|---|---|
| `GET /api/cursos/:cursoSlug/quizzes/:quizSlug` | Quiz publicado, questões e alternativas ordenadas |
| `GET /api/cursos?published=true` | Agregados e resumos publicados de aulas e quizzes |
| `GET /api/cursos/:slug` | Árvore com `aulas` e `quizzes` por módulo |

O quiz público inclui a alternativa correta e a explicação. A correção acontece
no navegador. Esconder a resposta no servidor não traria integridade real, pois
o progresso também vive no navegador e não concede certificado ou acesso.

A árvore mantém o campo `aulas` atual e adiciona `quizzes`. Assim a mudança não
quebra consumidores existentes. Um helper do frontend combina as duas listas de
acordo com `aula_id` e `ordem`.

Para quiz publicado, a árvore retorna id, slug, título, aula associada, nota
mínima e número de questões. Para rascunho, retorna apenas id, título e
`publicado: false`.

### Rotas administrativas

| Rota | Uso |
|---|---|
| `POST /api/cursos/:cursoId/modulos/:moduloId/quizzes` | Criar quiz com banco de questões |
| `GET /api/cursos/quizzes/:id` | Abrir o editor |
| `PUT /api/cursos/quizzes/:id` | Substituir metadados e banco de questões |
| `DELETE /api/cursos/quizzes/:id` | Excluir quiz e conteúdo dependente |

Criação e atualização recebem o quiz inteiro, com questões e alternativas
aninhadas. O serviço valida a relação entre curso, módulo e aula, e grava tudo em
uma transação. Não existem endpoints separados para alternativas.

## Progresso no navegador

O valor em `opensilicio-cursos-progresso` passa a aceitar quizzes e uma última
atividade tipada.

```ts
type EstadoAula = 'concluida' | 'nao-concluida'

type ProgressoQuiz = {
  melhorNota: number
  tentativas: number
  concluido: boolean
}

type UltimaAtividade =
  | { tipo: 'aula'; slug: string }
  | { tipo: 'quiz'; slug: string }

type ProgressoCurso = {
  aulas: Record<string, EstadoAula>
  quizzes: Record<string, ProgressoQuiz>
  ultima: UltimaAtividade | null
}
```

O leitor aceita o formato antigo. Um `ultima` antigo em forma de string migra em
memória para `{ tipo: 'aula', slug }` no próximo write. `quizzes` ausente vira
um objeto vazio. Dados inválidos de quiz são descartados sem apagar aulas.

Ao finalizar uma tentativa:

1. o frontend calcula a porcentagem;
2. incrementa `tentativas`;
3. mantém o maior valor entre a nota antiga e a nova;
4. define `concluido` pela melhor nota e pela nota mínima do quiz;
5. grava a atividade como `ultima`.

Uma tentativa abaixo da nota mínima não remove uma conclusão anterior. Alterar a
nota mínima depois de publicado reavalia `concluido` ao ler o progresso.

O denominador contém aulas publicadas não opcionais e quizzes publicados. Um
quiz concluído soma uma atividade. Rascunhos não entram. Publicar um quiz novo
reduz a porcentagem até o aluno concluí-lo, como já ocorre ao publicar aula.
`zerarCurso` remove também quizzes e a última atividade.

## Experiência pública

### Currículo e espinha

O helper que combina atividades insere o quiz depois da aula associada ou no fim
do módulo. O quiz não recebe número de aula. Ele usa um ícone próprio e mostra um
destes estados:

- `Pendente`;
- `Melhor nota: 50%`;
- `Concluído: 75%`.

O total do módulo e a barra geral contam o quiz. Nenhuma atividade fica
desabilitada por causa de nota.

### Página do quiz

Rota: `/cursos/:cursoSlug/quizzes/:quizSlug`.

A página segue o mock A:

- espinha do curso à esquerda;
- cabeçalho com título, quantidade, nota mínima e melhor nota;
- índice numerado das questões;
- uma questão por vez;
- quatro alternativas com escolha única;
- respostas preservadas ao trocar de questão;
- contagem de respondidas;
- botão `Finalizar tentativa` disponível antes de responder tudo.

Se houver lacunas, uma confirmação informa quantas questões contam como erradas.
O aluno pode voltar ou finalizar.

Após finalizar, a tela mostra nota atual, melhor nota, tentativas e estado de
conclusão. Cada questão mostra escolha, resposta correta e explicação. Os botões
finais são `Tentar novamente` e `Próxima aula`. Nova tentativa limpa somente as
respostas da tela.

Tentativa incompleta vive apenas no estado React. Recarregar a página começa uma
nova tentativa sem incrementar o contador.

## Editor administrativo

`CursoEstrutura` ganha `Novo quiz` em cada módulo. O formulário oferece `Depois
de uma aula` ou `Fim do módulo`; a primeira opção abre o seletor de aula.

Metadados:

- título;
- slug;
- posição;
- nota mínima, 70% por padrão;
- publicação.

O editor segue o mock A. A coluna esquerda lista questões e permite criar,
remover e reordenar. A coluna direita edita:

- enunciado em texto simples;
- quatro alternativas fixas;
- resposta correta por radio;
- explicação obrigatória.

O formulário mantém todas as questões em um único estado. Trocar a seleção não
descarta valores. `Salvar` envia o documento completo. Erros aparecem junto ao
campo correspondente. A tela de estrutura mostra posição, quantidade de
questões, nota mínima e estado de publicação.

## Estados de erro e acessibilidade

- Falha de GET usa `ErroAoCarregar`; resposta vazia não representa erro.
- Falha ao salvar mantém o formulário e associa cada erro ao campo correto.
- Conflito de posição explica qual aula ou módulo já tem quiz.
- Alternativas usam `fieldset` e radio reais, com navegação por teclado.
- O índice informa questão atual, respondida e incorreta por texto e ícone, não
  apenas por cor.
- O foco vai para o título da questão ao navegar e para o resumo ao corrigir.
- A página funciona nos dois modos de cor. O modo escuro usa fundo `#000`.
- Em celular, a espinha do curso usa o drawer existente e o índice do quiz vira
  uma faixa horizontal rolável.
- Animações ficam em `transform` e `opacity` e respeitam
  `prefers-reduced-motion`.

## Testes e verificação

### Backend

- criação em rascunho e publicação válida;
- rejeição de questão incompleta, número diferente de quatro alternativas e
  respostas corretas inválidas;
- garantia de curso, módulo e aula compatíveis;
- unicidade por aula e para o fim do módulo;
- atualização atômica do banco de questões;
- filtro público de quiz e curso despublicados;
- árvore pública sem conteúdo de rascunho;
- exclusão de aula move e despublica o quiz;
- cascata ao excluir módulo ou curso.

### Frontend

- combinação e ordem de aulas e quizzes;
- cálculo da nota e limite inclusivo de 70%;
- melhor nota nunca diminui;
- tentativas incrementam após envio;
- migração do `localStorage` antigo;
- progresso conta quizzes publicados e ignora rascunhos;
- tentativa, correção e reinício;
- aviso de perguntas sem resposta;
- validação e serialização do editor.

### Comandos e navegador

- backend: build e testes Jest com Postgres de teste;
- frontend: `npm run typecheck`, `npm run build` e testes Vitest;
- desktop e celular;
- teclado e leitor de acessibilidade;
- modos claro e escuro;
- curso existente com progresso anterior à migração.

## Mock

A comparação visual foi criada em
`.superpowers/brainstorm/96022-1789917513/content/quiz-layouts.html`. O mock é
local por escolha do autor e não foi enviado ao Postplan. A opção A foi
selecionada.
