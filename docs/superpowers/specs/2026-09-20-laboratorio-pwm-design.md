# Laboratório PWM nas aulas: design

**Data:** 2026-09-20

**Status:** aprovado

**Mock escolhido:** opção A, "Bancada compacta"

**Mock publicado:** https://ekgpezy4okpx.postplan.dev

## Resumo

As aulas passam a aceitar um laboratório PWM dentro do conteúdo Lexical. O
primeiro uso será na aula sobre mistura de cores RGB do curso Projeto Digital.
O aluno escolhe uma hipótese, manipula o duty cycle e compara sua previsão com
a forma de onda, o tempo em nível alto e o brilho percebido do LED.

O laboratório fica dentro da aula. Ele não cria uma rota, não entra sozinho no
cálculo de progresso e não envia respostas ao servidor. A conclusão da aula
continua seguindo as regras atuais. Tentativas e ajustes são ilimitados.

A primeira versão será específica para PWM. Ela terá peças internas pequenas e
reutilizáveis, mas não tentará representar qualquer experimento de eletrônica.
Quando criarmos laboratórios de encoder ou contador, poderemos extrair apenas o
que realmente se repetir.

## Objetivo e critérios de sucesso

O laboratório deve ajudar o aluno a ligar quatro ideias que costumam aparecer
separadas no texto:

1. duty cycle é a fração do período em nível alto;
2. mudar o duty cycle não muda a tensão do nível lógico;
3. frequência e duty cycle são parâmetros diferentes;
4. o brilho percebido acompanha a energia média entregue ao LED.

A primeira versão está pronta quando:

- o autor consegue inserir e editar o laboratório pelo editor existente;
- a versão pública funciona com mouse, toque e teclado;
- escolher qualquer hipótese revela uma explicação e libera o controle;
- o slider atualiza forma de onda, tempo alto, tensão média e brilho percebido;
- o conteúdo continua legível em tela estreita e nos dois modos de cor;
- configuração inválida mostra um erro localizado sem derrubar a aula;
- serialização, cálculos e interação têm testes focados;
- o laboratório está inserido como rascunho na aula de mistura RGB antes da
  revisão final do conteúdo.

## Decisões

| Questão | Decisão |
|---|---|
| Interface | Opção A, pergunta e bancada na mesma moldura |
| Modelo | Nó Lexical próprio, `PwmLabNode` |
| Configuração | JSON5 validado, armazenado no próprio nó |
| Estado do aluno | Estado React transitório, sem persistência |
| Tentativas | Ilimitadas |
| Progresso | O laboratório não soma uma atividade separada |
| Revelação | Uma hipótese libera a bancada, mesmo quando está errada |
| Visualização | SVG próprio, sem nova dependência |
| Animação | Somente resposta a interação, com `transform` e `opacity` |
| Autoria inicial | Exemplo válido ao inserir e edição pela barra do widget |
| Escopo futuro | Encoder e contador ficam fora desta versão |

## Experiência do aluno

### Estado inicial

O laboratório mostra a pergunta e as alternativas na coluna esquerda. A coluna
direita já mostra a forma de onda inicial, os valores e o slider, mas o slider
começa desabilitado. Isso permite ao aluno inspecionar a bancada sem testar a
resposta antes de formular uma hipótese.

O texto acima das alternativas diz que não há limite de tentativas. O
laboratório nunca impede a rolagem, a navegação ou a conclusão da aula.

### Escolha da hipótese

Ao escolher uma alternativa:

- a alternativa ganha o estado `aria-pressed="true"`;
- a explicação daquela alternativa aparece logo abaixo;
- o slider é habilitado;
- o foco permanece na alternativa escolhida;
- leitores de tela recebem a explicação por uma região `aria-live="polite"`.

Uma resposta errada não exibe punição, contagem regressiva ou nota. A explicação
pede ao aluno que teste a hipótese na bancada. Ele pode escolher outra opção a
qualquer momento.

### Manipulação

O slider varia o duty cycle entre 5% e 95% em passos de 5 pontos percentuais.
Cada mudança atualiza, no mesmo frame de interface:

- a largura dos pulsos no SVG;
- o valor percentual;
- o tempo em nível alto;
- a tensão média calculada;
- a opacidade do LED simulado.

Frequência, tensão lógica e período vêm da configuração do autor. A interface
deixa claro quais valores mudam e quais permanecem constantes.

O LED dá um único pulso curto de escala quando o valor muda. A animação usa
`transform` e `opacity`, para após 140 ms e some quando o sistema pede movimento
reduzido. A forma de onda muda diretamente, sem interpolação contínua.

### Tela estreita

Abaixo do breakpoint já usado pelo conteúdo, a pergunta fica acima da bancada.
As leituras viram linhas empilhadas. O SVG mantém uma largura útil e pode
encolher sem criar rolagem horizontal na página.

## Arquitetura

### `PwmLabNode`

Um novo `DecoratorBlockNode`, tipo `os-pwm-lab`, guarda somente a string
`fonte`. O formato acompanha os widgets WaveDrom e Anatomia:

- `exportJSON` e `importJSON` serializam `fonte` e `format`;
- `exportDOM` e `importDOM` usam `data-os-pwm-lab`;
- `getTextContent()` devolve título, pergunta e alternativas em texto puro;
- a barra de autoria oferece `editar` e `remover` quando
  `editor.isEditable()` for verdadeiro;
- o leitor recebe a mesma configuração, mas não vê controles de autoria.

O nó entra em `LEXICAL_NODES`, que continua sendo a única lista usada pelo
editor e pelo leitor. Um `PwmLabPlugin` registra o comando de inserção e entra em
`OsWidgetPlugins`. A barra do editor recebe um botão "Laboratório PWM".

### Configuração

O botão insere um exemplo completo que já renderiza:

```js
{
  titulo: 'Brilho por PWM',
  pergunta: 'O que muda quando o duty cycle passa de 25% para 75%?',
  alternativas: [
    {
      texto: 'A frequência triplica.',
      correta: false,
      explicacao: 'A frequência permanece no valor configurado.'
    },
    {
      texto: 'O LED parece mais brilhante.',
      correta: true,
      explicacao: 'O sinal passa mais tempo em nível alto.'
    },
    {
      texto: 'A tensão alta passa de 3,3 V.',
      correta: false,
      explicacao: 'A largura do pulso muda, não o nível lógico.'
    }
  ],
  dutyInicial: 25,
  frequenciaHz: 100,
  tensaoVolts: 3.3
}
```

A validação aceita de duas a quatro alternativas e exige exatamente uma
correta. Também exige textos não vazios e estes limites:

- `dutyInicial`: inteiro entre 5 e 95;
- `frequenciaHz`: número maior que zero e até 100.000;
- `tensaoVolts`: número maior que zero e até 24.

Esses limites evitam divisões inválidas e rótulos que não cabem na interface.
A fonte pode ter comentários e vírgula final porque usa o parser JSON5 já
presente no frontend.

### Funções puras

Os cálculos ficam fora do componente React:

```ts
type PwmMedidas = {
  periodoMs: number
  tempoAltoMs: number
  tensaoMediaVolts: number
}

calcularPwm(duty: number, frequenciaHz: number, tensaoVolts: number): PwmMedidas
criarCaminhoPwm(duty: number, ciclos: number): string
parsearConfiguracaoPwm(fonte: string): ResultadoConfiguracao
```

`calcularPwm` é a fonte dos números mostrados. `criarCaminhoPwm` produz uma
forma de onda normalizada, e o SVG decide o tamanho final com `viewBox`.
`parsearConfiguracaoPwm` devolve um resultado discriminado de sucesso ou erro,
sem lançar exceção para o componente.

### Componente de apresentação

`PwmLab` recebe uma configuração já validada. Ele controla apenas:

- alternativa selecionada;
- duty cycle atual;
- sinal curto de interação do LED.

O componente não conhece Lexical, banco de dados, progresso do curso ou API.
Essa separação permite testar a bancada sem montar um editor inteiro e deixa o
nó responsável somente por serialização e comandos de autoria.

## Estado e dados

Não haverá migração nem endpoint novo. A configuração faz parte do JSON Lexical
da aula e passa pelo fluxo de salvamento existente.

O estado da interação não vai para `localStorage`. Reabrir a aula restaura o
duty cycle inicial e nenhuma hipótese selecionada. Persistir cada movimento não
ajudaria o aluno a retomar o curso e criaria uma segunda versão de progresso
dentro da própria aula.

O laboratório também não entra no denominador do curso. Como ele faz parte da
aula, contá-lo de novo faria uma única aula valer duas atividades. A conclusão
manual ou automática da aula continua sendo o sinal de progresso.

## Autoria e falhas

Na primeira versão, `editar` abre um `window.prompt` com a fonte atual, igual ao
WaveDrom. Cancelar não muda o nó. Confirmar atualiza a fonte e dispara a mudança
normal do editor.

Uma configuração inválida mostra `.os-widget__erro` dentro da moldura. No modo
de edição, a barra e o botão `editar` continuam visíveis para o autor corrigir o
problema. No modo público, a falha fica restrita ao laboratório e o restante da
aula continua renderizando.

O parser exibe mensagens específicas para JSON inválido, alternativa ausente,
mais de uma resposta correta e valores fora dos limites. Ele não tenta corrigir
silenciosamente os dados do autor.

## Estilo e acessibilidade

O laboratório reutiliza `.os-widget` e acrescenta classes `os-pwm-*` em
`patterns/widgets.css`. Não cria cartões arredondados nem sombras. Bordas,
tipografia e cores usam os tokens do design system.

Requisitos de acesso:

- alternativas são botões reais e funcionam por teclado;
- o slider tem um nome que inclui a unidade;
- leituras usam texto além da forma visual;
- o SVG tem uma descrição curta, mas os números são a fonte acessível dos
  valores;
- cor não é o único indicador de seleção ou acerto;
- contraste segue os dois modos de cor;
- `prefers-reduced-motion` remove o pulso do LED.

## Testes

### Unitários

- cálculo para 25%, 50% e 75%;
- frequência fracionária e arredondamento apenas na apresentação;
- caminho SVG nos limites de 5% e 95%;
- parse do exemplo padrão;
- JSON5 inválido;
- duas a quatro alternativas;
- nenhuma ou mais de uma alternativa correta;
- limites de duty, frequência e tensão;
- ida e volta de `exportJSON` e `importJSON` do nó;
- importação DOM reconhece somente `data-os-pwm-lab`.

### Componente

- slider começa desabilitado;
- qualquer hipótese habilita o slider e mostra sua explicação;
- trocar a hipótese atualiza seleção e explicação;
- mover o slider atualiza todas as leituras;
- o componente não chama persistência ou API;
- configuração inválida mantém a aula renderizável.

### Verificação da aplicação

- `npm run test` no frontend;
- `npm run typecheck` no frontend;
- `npm run build` no frontend;
- teste manual no editor local para inserir, editar, remover e salvar;
- teste manual da aula pública nos modos claro e escuro, em desktop e celular;
- verificação de teclado e movimento reduzido.

## Publicação e conteúdo piloto

Depois da implementação local e dos testes:

1. publicar a mudança do site pelo fluxo normal do repositório;
2. acompanhar o deploy e verificar a página pública;
3. abrir a aula de mistura de cores RGB no admin;
4. inserir o laboratório no ponto em que o texto apresenta PWM;
5. adaptar pergunta, alternativas e explicações ao conteúdo da aula;
6. salvar a aula como rascunho;
7. recarregar em uma segunda aba e conferir o JSON salvo e a renderização;
8. deixar a aula em rascunho para revisão do Paulo.

O deploy publica a capacidade do site, não a aula. A aula piloto permanece em
rascunho até a revisão de conteúdo e a inclusão das capturas reais.

## Fora desta versão

- laboratório genérico configurável por blocos;
- persistência de respostas ou parâmetros;
- nota, certificado ou atividade própria no progresso;
- analytics de escolhas;
- múltiplos canais RGB simultâneos;
- alteração de frequência pelo aluno;
- código Verilog editável dentro do laboratório;
- laboratórios de encoder, contador ou display;
- editor visual para a configuração JSON5.

## Melhorias anotadas para depois

O uso real deste laboratório deve informar as próximas decisões. As melhorias
mais promissoras são:

- painel de propriedades no editor para substituir `window.prompt`;
- biblioteca de laboratórios disponíveis, com pré-visualização antes de inserir;
- modo RGB com três canais e cor resultante;
- perguntas de previsão reutilizáveis por outros widgets;
- botão "copiar estado" que gera um link ou trecho de configuração;
- eventos locais de interação para estudos de usabilidade, somente com
  consentimento e sem registrar respostas pessoais.
