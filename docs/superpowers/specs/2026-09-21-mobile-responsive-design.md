# Design responsivo para o site e o painel administrativo

**Data:** 2026-09-21  
**Estado:** aprovado visualmente, aguardando revisão desta especificação  
**Referência visual:** [opção A](https://7sq431khufz5.postplan.dev)

## Objetivo

Tornar todo o site utilizável em celulares a partir de 320 px, com prioridade para o painel administrativo, sem mudar a experiência desktop nem redesenhar a identidade visual Industry.

O trabalho corrige quatro problemas observados na auditoria:

1. O menu permanente do admin ocupa 240 px e empurra o conteúdo para fora da tela.
2. Tabelas e grupos de ações do admin causam rolagem horizontal e alvos pequenos.
3. Os filtros da página Educação ficam comprimidos e difíceis de operar.
4. Alguns controles, links e hierarquias de títulos do site público não atendem bem ao uso por toque e leitores de tela.

Não haverá mudança de API, banco de dados, formato de conteúdo ou fluxo de publicação.

## Princípios

- A experiência desktop atual permanece estável.
- Abaixo do breakpoint `md` do MUI, 900 px, o layout passa a priorizar toque e leitura vertical.
- Controles principais terão pelo menos 48 px de altura. Controles secundários terão pelo menos 44 px.
- Nenhuma página deve criar rolagem horizontal em 320 px.
- Movimento serve apenas como retorno ou continuidade espacial, usa `transform` e `opacity` e respeita `prefers-reduced-motion`.
- O visual continua quadrado, denso e alinhado ao sistema Industry. Não serão adicionados cartões decorativos, cantos arredondados ou textos explicativos desnecessários.

## 1. Navegação do painel administrativo

### Desktop

O `AdminLayout` mantém o `Drawer` permanente de 240 px e a barra superior atual.

### Mobile e tablet

- O `Drawer` passa a ser temporário e fica fechado por padrão.
- A barra superior ganha um botão de menu de 48 px com `aria-label="Abrir navegação"`.
- O menu terá largura máxima de 280 px e nunca ocupará mais que `100vw - 48px`.
- Selecionar uma rota fecha o menu.
- A rota ativa recebe indicação visual e `aria-current="page"`.
- `Ver site` e `Sair` ficam dentro do menu em telas estreitas para o título e o botão de abertura caberem sem truncamento.
- O conteúdo principal ocupa a largura completa, com 16 px de margem lateral no mobile e 24 px a partir de `md`.

O estado aberto do menu é transitório. Ele não será salvo entre páginas ou sessões.

## 2. Listas do painel administrativo

As listas de Cursos, Blog, Educação e Wiki manterão as tabelas atuais no desktop. Abaixo de `md`, cada registro vira uma linha vertical compacta.

Cada linha mobile contém:

- título como informação principal;
- estado e uma ou duas informações essenciais, como categoria, nível ou data;
- um único botão de ações de 48 px;
- um menu contextual com as mesmas ações disponíveis no desktop.

O menu contextual usa os textos explícitos das ações, não apenas ícones. Exclusão continua exigindo a confirmação já existente. Estados de carregamento, erro e lista vazia continuam semanticamente separados.

Para evitar uma abstração genérica difícil de manter, será criado apenas um pequeno componente compartilhado para a moldura da linha mobile e seu menu. Cada página continua responsável pelos campos e ações do próprio tipo de conteúdo.

## 3. Estrutura dos cursos

Na tela de estrutura:

- o cabeçalho do curso empilha título, estado e ações no mobile;
- cada módulo mantém título, descrição e contagem visíveis;
- ações do módulo ficam em um menu contextual de 48 px;
- cada aula ou quiz mostra tipo, título e estado em uma linha vertical;
- ações de editar, publicar, mover e excluir ficam no menu contextual do registro;
- os botões `Nova aula` e `Novo quiz` formam uma barra fixa na base apenas no mobile;
- a página reserva espaço igual à altura da barra, incluindo `env(safe-area-inset-bottom)`, para ela não cobrir o último item.

A barra fixa não aparece quando um diálogo ou menu está aberto. No desktop, os controles atuais permanecem em linha.

## 4. Formulários e editor

- Cabeçalhos de formulário empilham título e ações abaixo de `md`.
- Campos que hoje dividem uma linha passam a uma coluna em 320 px.
- O editor Lexical ocupa 100% da largura disponível.
- A barra do editor pode rolar horizontalmente dentro do próprio contêiner. Ela não aumenta a largura da página.
- Botões da barra terão área interativa mínima de 44 px no mobile.
- Ações principais, como `Salvar`, ficam visíveis depois do cabeçalho sem alterar o único caminho confiável de gravação do formulário.

Nenhum nó será injetado no DOM editável e nenhum mecanismo de salvamento automático será introduzido.

## 5. Página Educação

### Desktop

A busca e os filtros visíveis continuam como estão.

### Mobile

- A busca aparece primeiro e ocupa a largura toda, com 48 px de altura.
- Um botão `Filtros` de 48 px abre um `Drawer` inferior.
- O `Drawer` contém categoria e nível em grupos nomeados, com alvos mínimos de 44 px.
- As escolhas atualizam a listagem imediatamente. O botão `Ver resultados` fecha a folha.
- Filtros ativos aparecem abaixo da busca como resumo removível.
- `Limpar filtros` só aparece quando houver seleção além dos valores padrão.

A mesma fonte de estado alimenta desktop e mobile, sem duplicar regras de filtragem.

## 6. Toque, semântica e movimento no site público

### Alvos de toque

- Botões de ícone do cabeçalho e rodapé passam a 48 px no mobile.
- Filtros e campos recebem altura mínima de 44 px e 48 px, respectivamente.
- Links de navegação do rodapé ganham área vertical de 44 px sem aumentar visualmente o texto.
- Botões de progresso e navegação de aulas terão pelo menos 44 px.

### Hierarquia de títulos

- Cada página pública terá um único `h1`.
- Seções principais usam `h2`.
- Títulos de cartões e subseções usam `h3` quando estiverem dentro de uma seção.
- O tamanho visual existente será preservado, separando semântica de aparência.

Os ajustes incluem Landing, Sobre, Educação, Blog, Cursos e Wiki.

### Movimento

O `RevealOnLoad` continua com duração curta no desktop. Em telas abaixo de `md` e quando `prefers-reduced-motion` estiver ativo, o conteúdo carregado aparece sem deslocamento e sem período de baixa opacidade. Transições locais de listas podem continuar, desde que não atrasem a leitura.

## 7. Acessibilidade e teclado

- A abertura do menu e dos filtros move o foco para o contêiner correto por meio do comportamento nativo do MUI.
- Fechar um `Drawer` devolve o foco ao botão que o abriu.
- Menus contextuais têm nome acessível que inclui o registro, por exemplo `Ações de Projeto Digital`.
- Todo item de menu funciona por teclado.
- Indicadores de foco continuam visíveis nos temas claro e escuro.
- Controles que usam apenas um ícone recebem `aria-label`.

## 8. Estados e falhas

- O layout responsivo não altera consultas, paginação, autenticação ou permissões.
- Erros de API continuam usando os componentes de erro existentes.
- Um menu aberto fecha ao navegar, pressionar Escape ou tocar fora dele.
- A rotação do aparelho não perde filtros nem dados digitados no formulário.
- Textos longos quebram linha. Slugs e código podem rolar dentro do próprio bloco, nunca na página inteira.

## 9. Verificação

### Testes automatizados

- `AdminLayout`: Drawer permanente no desktop, temporário no mobile, fechamento após navegação e nomes acessíveis.
- Listas administrativas: tabela no desktop e linhas mobile com as mesmas ações.
- Estrutura de curso: menus de módulo e atividade mantêm todas as ações.
- Educação: abertura da folha, aplicação e limpeza de filtros.
- Páginas públicas: um `h1` por página e ordem de títulos coerente.
- Componentes modificados mantêm testes de tema e `prefers-reduced-motion` quando aplicável.

### Verificação manual

- Larguras: 320, 360, 390, 768 e 900 px.
- Paisagem: 844 por 390 px.
- Temas claro e escuro.
- Navegação por teclado e redução de movimento.
- Rotas públicas principais, todas as listas do admin, estrutura de curso e formulários com Lexical.
- Ausência de rolagem horizontal no documento.

Antes de concluir: executar `npm run typecheck`, `npm run test` e `npm run build` em `openSilicioWebsite/`.

## Fora do escopo

- Redesenho visual da marca ou do desktop.
- Alterações no backend ou no banco de dados.
- Salvamento automático no editor.
- Novos recursos pedagógicos ou animações interativas de conteúdo.
- Publicação em produção sem uma autorização separada depois da validação local.
