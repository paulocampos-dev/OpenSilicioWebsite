# Diagrama anotado de identificador — nó `AnatomiaNode`

Data: 2026-09-03

## Contexto e motivação

O post sobre células padrão do sky130 usa um "diagrama" desenhado em ASCII
(caracteres de desenho de caixa `│ └ ─`) dentro de um bloco de código, para
apontar cada trecho de `sky130_fd_sc_hd__inv_1` para sua explicação. Em tela
de celular isso não sobrevive: o bloco assume uma largura generosa (o texto
da explicação fica ao lado da árvore, não abaixo), e não existe hoje nenhum
breakpoint de largura em `code.css` além de `overflow-x: auto` — a página
inteira não tem nenhum `@media` de largura, só `prefers-reduced-motion`.

Mock comparando três abordagens (numerado + legenda / árvore SVG / toque
para revelar) foi publicado e revisado; a abordagem escolhida foi a faixa
numerada com legenda. As outras duas foram descartadas: a árvore em SVG
precisa de coordenadas medidas por caractere e de um segundo layout para
telas estreitas (dobra o código para o mesmo resultado visual); o popover
esconde as explicações por padrão, o que vai contra o objetivo do diagrama
original de ser escaneado de uma vez.

## Visão geral

Um novo nó Lexical, `AnatomiaNode` (tipo `os-anatomia`), soma-se aos widgets
já existentes (`WaveDromNode`, `SevenSegmentNode`, `EmbedNode`) e segue
exatamente o mesmo padrão:

- `DecoratorBlockNode` guardando uma única string `fonte` (JSON5).
- Editado com `window.prompt`, sem formulário dedicado.
- Renderizado dentro do invólucro compartilhado `.os-widget`
  (`styles/design-system/patterns/widgets.css`), com barra de título e
  botões editar/remover quando `editor.isEditable()`.
- Registrado em `nodeSet.ts` (leitor e editor precisam do mesmo node, ou o
  post inteiro falha ao renderizar — pitfall já documentado no
  `CLAUDE.md` do repo).
- Inserido por um plugin novo, `AnatomiaPlugin.tsx`, montado em
  `widgets.tsx`, com botão no `ToolbarPlugin.tsx`.

Ao contrário do WaveDrom, não há biblioteca externa nem SVG: a renderização
é HTML/CSS puro, então não precisa de import dinâmico.

## Formato da fonte

JSON5, mesmo espírito do `WAVEDROM_EXEMPLO`:

```js
{
  texto: 'sky130_fd_sc_hd__inv_1',
  partes: [
    { trecho: '_1', nota: 'força 1, a versão mais fraca' },
    { trecho: 'inv', nota: 'inversor' },
    { trecho: 'hd', nota: 'high density, a biblioteca de alta densidade' },
    { trecho: 'sc', nota: 'standard cell' },
    { trecho: 'fd', nota: 'foundry, quer dizer que a biblioteca é da própria SkyWater' },
    { trecho: 'sky130', nota: 'o processo' },
  ]
}
```

- `texto`: a string anotada.
- `partes`: lista ordenada como o autor quer que a legenda apareça (não
  precisa ser a ordem esquerda-para-direita da string — o post original
  explica de trás para frente).
- Cada `trecho` é localizado em `texto` por busca de substring simples.

Este exemplo real (sky130) é o próprio `ANATOMIA_EXEMPLO` usado quando o
autor insere um diagrama vazio — dobra como documentação viva do formato.

## Resolução (função pura, testável)

`resolverPartes(texto: string, partes: Parte[]): ResultadoResolucao`

Para cada `parte`, na ordem do array:
1. Localiza `trecho` em `texto` com `indexOf`.
2. **Não encontrado** → erro: `trecho "X" não aparece em "texto"`.
3. **Ambíguo** (aparece mais de uma vez — `texto.indexOf(trecho) !==
   texto.lastIndexOf(trecho)`) → erro pedindo mais contexto para
   desambiguar (ex.: usar `'_1'` em vez de `'1'`, já que `'1'` também
   aparece dentro de `'sky130'`).
4. **Sobreposição** com um trecho já resolvido → erro.

Sucesso: lista de `{ inicio, fim, trecho, nota, numero }` (numero = posição
no array `partes`, 1-based — é o número que aparece tanto no expoente sobre
o texto quanto na legenda) mais os trechos de `texto` não cobertos por
nenhuma parte (os separadores, renderizados sem destaque).

Esta função não toca em Lexical nem DOM — vive em um módulo próprio
(`AnatomiaNode.ts` ou um arquivo `resolverPartes.ts` ao lado) para ser
testada por Vitest isoladamente: caminho feliz (exemplo sky130), trecho
ausente, trecho ambíguo, sobreposição, `partes` vazio.

## Renderização

- **Texto**: a string completa em `font-family: var(--font-mono)`, cada
  trecho anotado com sublinhado (`border-bottom`) na cor de destaque e um
  `<sup>` com o número; os trechos não anotados (separadores) em
  `--color-text-faint`. Sem SVG, sem posição calculada — é texto normal que
  quebra linha como qualquer parágrafo se precisar.
- **Legenda**: abaixo, lista na ordem de `partes` (não na ordem
  esquerda-para-direita da string): selo numerado, o trecho em monoespaçada,
  a nota em texto normal.
- Erros de resolução aparecem com o padrão já existente
  `.os-widget__erro` (mesmo estilo usado pelo WaveDrom quando o JSON5 não
  faz parse).
- Novas classes CSS entram em `widgets.css`, na seção de padrões
  compartilhados dos widgets, seguindo a mesma convenção de reagir a
  `[data-color-mode]` (usa só os tokens `--color-*` já existentes, então não
  precisa de regra própria de modo escuro).

## Edição e serialização

Mesma forma de `WaveDromNode`:
- `getFonte()`/`setFonte()`, `exportJSON`/`importJSON` carregando `fonte`.
- `exportDOM`/`importDOM` via atributo `data-os-anatomia` no elemento
  exportado.
- `getTextContent()` retorna o `texto` resolvido quando o parse funciona
  (fallback melhor para busca/texto puro que o WaveDrom, que devolve a
  fonte crua); se o parse falhar, cai de volta para a própria `fonte`.
- Editar reabre `window.prompt` com a fonte atual; nenhuma validação client
  side além da que já roda no render (mesma filosofia do WaveDrom: erro
  aparece no widget, não bloqueia a digitação).

## Teste

- Unitário (Vitest) para `resolverPartes`: caminho feliz, trecho ausente,
  trecho ambíguo, sobreposição, `partes` vazio.
- Manual: inserir o widget no editor local, conferir o exemplo padrão,
  testar edição e remoção, checar erro ao digitar JSON5 inválido ou um
  `trecho` que não bate.
- Visual: abrir o post renderizado em uma viewport estreita (as duas
  screenshots que motivaram isso) e confirmar que não há mais scroll
  horizontal nem colunas desalinhadas.

## Rollout nos posts existentes

Depois de implementado e testado localmente, usar o navegador (sessão já
autenticada no admin) para abrir os dois posts sinalizados, substituir o
bloco de código ASCII pelo novo widget com a fonte equivalente ao conteúdo
original, conferir em largura estreita, e salvar pelo botão Salvar (único
caminho de escrita confiável — o formulário não tem autosave).

## Documentação para outras sessões

Depois da implementação, acrescentar uma entrada na seção "The Lexical
editor and the admin panel" do `CLAUDE.md` do repo, no mesmo estilo das
entradas de WaveDrom/7-segmentos: o que é `AnatomiaNode`, o formato da
fonte, e o pitfall de desambiguação de `trecho` (ambíguo por padrão,
precisa de mais contexto tipo `'_1'`).
