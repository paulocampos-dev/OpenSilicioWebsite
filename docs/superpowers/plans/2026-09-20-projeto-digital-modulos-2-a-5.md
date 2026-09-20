# Módulos 2 a 5 do Projeto Digital: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar as sete aulas e os sete quizzes restantes do curso Projeto Digital, cadastrar tudo como rascunho e deixar o material pronto para a revisão e as capturas de Paulo.

**Architecture:** O Markdown em `conteudo/cursos/projeto-digital/` continua sendo a fonte de cada aula, e `conteudo/build.js` gera o HTML que entra no editor Lexical. Os quizzes ficam em JSON editorial e são cadastrados no formulário próprio. O painel administrativo é o único caminho de gravação; cada salvamento será conferido por recarga e pelo currículo público.

**Tech Stack:** Markdown com front matter YAML, JSON, Node.js com `marked` e `js-yaml`, editor Lexical, painel React, API Express e navegador autenticado.

**Spec:** `docs/superpowers/specs/2026-09-20-projeto-digital-modulos-2-a-5-design.md`

## Restrições globais

- Criar sete aulas e sete quizzes nos módulos 3 a 6 exibidos no site.
- Manter todas as novas aulas e quizzes com `publicado = false`.
- Manter o curso publicado e não usar os botões "Publicar módulo" ou "Publicar curso".
- Reaproveitar cada registro "Aulas em preparação" como a primeira aula real do módulo. Não excluir esses registros.
- Adaptar a sequência e os conceitos do Zero to ASIC. Não traduzir literalmente texto, alternativas ou explicações.
- Não copiar imagens, screenshots ou vídeos do curso de referência.
- Usar português brasileiro e o ambiente fixado pelo OpenSilício, incluindo `DOCKER_TAG=2026.08`, `/foss/designs`, `sky130A` e a biblioteca `sky130_fd_sc_hd`.
- Conferir comandos do LibreLane, limites do Tiny Tapeout e fluxo de submissão na documentação oficial no dia da redação.
- Inserir `> **IMAGEM.** ...` em cada ponto que precisa de uma captura de Paulo. O marcador deve dizer o que mostrar.
- Integrar recursos e links ao fim da aula correspondente. Não criar uma atividade separada de recursos.
- Cada quiz usa nota mínima de 70%, quatro alternativas, exatamente uma correta, tentativas ilimitadas e nenhuma trava de navegação.
- Preservar todas as perguntas relevantes da referência. Perguntas antigas devem avaliar o mesmo conceito com comandos e números atuais.
- Nunca responder, enviar ou finalizar uma tentativa no curso de referência.
- Não alterar código do site, banco, editor ou sistema de quizzes nesta entrega.
- Registrar atritos e ideias em `docs/course-authoring-improvements.md`, sem implementá-los nesta entrega.
- Nunca adicionar `.superpowers/` ao Git.

## Pontos de revisão

- Um rascunho não pode aumentar o denominador do progresso. A validação pública de cada módulo compara a contagem antes e depois do cadastro.
- O placeholder precisa manter sua posição ao virar aula. A conferência do painel compara a primeira atividade de cada módulo antes e depois da edição.
- A colagem no Lexical pode perder conteúdo ou manter estado antigo. Cada aula será recarregada em uma segunda leitura e comparada ao Markdown.
- Um quiz pode salvar com posição, alternativa correta ou publicação incorreta. Cada cadastro será reaberto e todos esses campos serão conferidos.
- Fatos sujeitos a mudança podem tornar aula e quiz incoerentes. Cada módulo técnico registra a URL oficial e a data da consulta em `conteudo/cursos/projeto-digital/REFERENCIAS.md`.

---

### Tarefa 1: Criar o registro de melhorias de autoria

**Arquivos:**
- Criar: `docs/course-authoring-improvements.md`
- Criar: `conteudo/cursos/projeto-digital/REFERENCIAS.md`

**Interfaces:**
- Consome: observações feitas durante o cadastro das aulas e quizzes.
- Produz: uma fila editorial com as colunas `Data`, `Contexto`, `Atrito`, `Impacto`, `Contorno atual`, `Melhoria proposta` e `Prioridade`.
- Produz: um registro local das fontes externas que precisam ser revisitadas quando o conteúdo for atualizado.

- [ ] **Passo 1: Criar o arquivo com regras de uso**

Use este conteúdo inicial:

```markdown
# Melhorias na autoria de cursos

Este arquivo registra problemas e oportunidades observados enquanto conteúdo real é produzido. Ele não é uma lista de funcionalidades prometidas.

## Como registrar

- Descreva o caso concreto, não uma preferência abstrata.
- Informe quem sofre o impacto: autor, estudante ou ambos.
- Registre o contorno usado para terminar o trabalho atual.
- Proponha a menor mudança que resolveria o problema.
- Use prioridade alta apenas quando houver risco de perda de dados, publicação acidental ou bloqueio da autoria.

## Observações

| Data | Contexto | Atrito | Impacto | Contorno atual | Melhoria proposta | Prioridade |
|---|---|---|---|---|---|---|
```

- [ ] **Passo 2: Conferir que o documento aprovado menciona o registro**

Execute:

```bash
rg -n "Registro de melhorias|course-authoring-improvements" docs/superpowers/specs/2026-09-20-projeto-digital-modulos-2-a-5-design.md
```

Esperado: duas ocorrências que explicam o uso do arquivo e deixam mudanças de produto fora do escopo.

- [ ] **Passo 3: Validar que não há observações inventadas**

Execute:

```bash
rg -n '^\|' docs/course-authoring-improvements.md
```

Esperado: apenas o cabeçalho e o separador. Novas linhas só entram depois de um atrito observado.

- [ ] **Passo 4: Criar o registro local de fontes técnicas**

Use este conteúdo inicial em `conteudo/cursos/projeto-digital/REFERENCIAS.md`:

```markdown
# Referências externas do Projeto Digital

Este arquivo guarda a origem de fatos e comandos que podem mudar. Atualize a data e a decisão editorial sempre que revisar uma aula.

| Data | Módulo | Tópico | Fonte | Decisão editorial |
|---|---|---|---|---|
```

O arquivo fica em `conteudo/`, que já está no `.gitignore`. Ele acompanha os rascunhos locais e não entra no site.

- [ ] **Passo 5: Registrar a infraestrutura editorial**

```bash
git add docs/course-authoring-improvements.md
git commit -m "docs(cursos): registrar melhorias de autoria"
```

### Tarefa 2: Produzir o módulo Construindo projetos digitais

**Arquivos:**
- Criar: `conteudo/cursos/projeto-digital/02-1-misturador-rgb.md`
- Criar: `conteudo/cursos/projeto-digital/02-1-misturador-rgb.html`
- Criar: `conteudo/cursos/projeto-digital/02-2-contador-de-frequencia.md`
- Criar: `conteudo/cursos/projeto-digital/02-2-contador-de-frequencia.html`
- Criar: `conteudo/cursos/projeto-digital/quiz-02-1-misturador-rgb.json`
- Criar: `conteudo/cursos/projeto-digital/quiz-02-2-contador-de-frequencia.json`
- Modificar por geração: `conteudo/index.html`
- Modificar se houver observação real: `docs/course-authoring-improvements.md`

**Interfaces:**
- Consome: ambiente do módulo 1, `https://github.com/mattvenn/rgb_mixer_2025`, `https://github.com/mattvenn/frequency_counter_2025`, as aulas 11 a 14 de Educação e o registro `REFERENCIAS.md`.
- Produz: duas aulas em Markdown e HTML, um quiz de 10 questões e um quiz de 3 questões.

- [ ] **Passo 1: Escrever a aula do misturador RGB**

Antes de redigir, registre em `REFERENCIAS.md` os dois repositórios do módulo, a data da consulta e os branches usados.

Use este front matter:

```yaml
---
ordem: "02-1"
modulo: "3. Construindo projetos digitais"
titulo: "Misturador de cores RGB"
slug: "misturador-de-cores-rgb"
termos_wiki: ["Verilog", "RTL", "cocotb", "Testbench", "Yosys"]
---
```

O corpo deve ensinar, nesta ordem:

1. resultado esperado e clone do branch `start` de `rgb_mixer_2025` em `/foss/designs`;
2. PWM de 8 bits, contador síncrono, comparação `count < level` e saída registrada;
3. teste com `make test_pwm`, depuração com `make show_pwm` e síntese visual com `make show_synth_pwm`;
4. encoder rotativo, sinais em quadratura, detecção de direção e por que o contato precisa de debounce;
5. três canais PWM ligados aos níveis R, G e B;
6. teste integrado e leitura das formas de onda;
7. erros comuns, como usar o clock como dado, confundir duty cycle com frequência e ignorar bouncing;
8. recursos oficiais ou repositórios realmente usados.

Inclua marcadores para uma forma de onda PWM, a direção do encoder e o teste integrado passando. Não incorpore o vídeo original.

- [ ] **Passo 2: Escrever o quiz do misturador RGB**

Crie `quiz-02-1-misturador-rgb.json` com título `Quiz: misturador de cores RGB`, slug `quiz-misturador-rgb`, nota mínima 70 e posição depois da aula 02-1.

As dez questões devem avaliar, com redação própria:

1. encoder mecânico precisa de debounce: sim;
2. bits para 256 níveis de duty cycle: 8;
3. direção do encoder: defasagem entre os dois sinais;
4. forma segura de desacelerar lógica síncrona: clock enable;
5. LED em 70% contra 50%: tende a parecer mais brilhante;
6. uso do PWM: produzir valor médio analógico a partir de uma saída digital;
7. sinal digital: estados válidos 0 e 1;
8. amostrar durante uma transição: risco de metastabilidade;
9. comando do Yosys usado para visualizar o circuito: `show`;
10. contato físico que alterna várias vezes ao fechar: bouncing.

Cada explicação precisa ligar a resposta ao trecho da aula, sem citar o curso de referência.

- [ ] **Passo 3: Escrever a aula do contador de frequência**

Use este front matter:

```yaml
---
ordem: "02-2"
modulo: "3. Construindo projetos digitais"
titulo: "Contador de frequência"
slug: "contador-de-frequencia"
termos_wiki: ["Verilog", "RTL", "cocotb", "Testbench", "Síntese lógica"]
---
```

O corpo deve cobrir:

1. clone do branch `start` de `frequency_counter_2025`;
2. detector de borda de subida com registrador do estado anterior;
3. janela fixa de medição em ciclos de clock;
4. contagem dos eventos e relação entre janela, clock de referência e frequência medida;
5. conversão do valor binário para dois dígitos decimais;
6. multiplexação dos displays de sete segmentos;
7. máquina de estados que mede, converte e atualiza a saída;
8. testes em cocotb e ondas para uma frequência conhecida;
9. limites, resolução e overflow;
10. recursos e próximos experimentos.

Inclua marcadores para a borda detectada, a sequência de estados e a saída nos dois displays.

- [ ] **Passo 4: Escrever o quiz do contador de frequência**

Crie `quiz-02-2-contador-de-frequencia.json` com título `Quiz: contador de frequência`, slug `quiz-contador-de-frequencia`, nota mínima 70 e posição depois da aula 02-2.

As três questões avaliam:

1. estrutura para sequenciar operações: máquina de estados finitos;
2. circuito para escolher entre sinais: multiplexador;
3. biblioteca Python usada no teste: cocotb.

A primeira questão precisa ganhar um quarto distrator plausível, pois a referência traz somente três alternativas.

- [ ] **Passo 5: Gerar e validar as fontes do módulo**

Execute:

```bash
cd conteudo
node build.js
```

Esperado: os dois `.md` geram os dois `.html`; nenhum aviso de tabela, linha horizontal ou imagem Markdown.

Valide os quizzes:

```bash
node -e 'const fs=require("fs"); for(const f of process.argv.slice(1)){const q=JSON.parse(fs.readFileSync(f)); if(q.nota_minima!==70) throw Error(`${f}: nota`); for(const [i,x] of q.questoes.entries()){if(x.alternativas.length!==4) throw Error(`${f}: questão ${i+1} sem 4 alternativas`); if(x.alternativas.filter(a=>a.correta).length!==1) throw Error(`${f}: questão ${i+1} sem resposta única`);}}' cursos/projeto-digital/quiz-02-1-misturador-rgb.json cursos/projeto-digital/quiz-02-2-contador-de-frequencia.json
```

Esperado: saída vazia e código 0.

- [ ] **Passo 6: Transformar o placeholder e criar a segunda aula no painel**

No módulo `Construindo projetos digitais`:

1. abra `Aulas em preparação` e substitua título, slug e corpo pela aula 02-1;
2. confirme que `Publicado` continua desligado e salve;
3. volte à estrutura, crie a aula 02-2, deixe `Publicado` desligado e salve;
4. nunca use `Publicar módulo`.

A aula existente deve continuar como primeira aula. A nova deve ficar em segundo lugar.

- [ ] **Passo 7: Criar os dois quizzes no painel**

Cadastre o primeiro depois de `Misturador de cores RGB` e o segundo depois de `Contador de frequência`. Copie todas as questões, marque uma alternativa correta por questão, mantenha 70% e `Publicado` desligado.

- [ ] **Passo 8: Reabrir e conferir o estado salvo**

Recarregue as quatro telas. Confira título, slug, módulo, corpo, posição do quiz, quantidade de questões, alternativas, resposta correta, explicação, nota mínima e estado de rascunho.

Abra o currículo público em outra aba. Esperado:

- quatro atividades na ordem aula, quiz, aula, quiz;
- todas com `EM BREVE`;
- nenhuma rota pública de quiz acessível;
- o progresso continua `1 de 1 atividades concluídas` até que conteúdo seja publicado.

- [ ] **Passo 9: Registrar somente melhorias observadas**

Se o painel, editor ou leitura pública gerou atrito, adicione uma linha a `docs/course-authoring-improvements.md`. Se nada novo apareceu, não altere o arquivo.

### Tarefa 3: Produzir o módulo Verificação

**Arquivos:**
- Criar: `conteudo/cursos/projeto-digital/03-1-provando-temporizador.md`
- Criar: `conteudo/cursos/projeto-digital/03-1-provando-temporizador.html`
- Criar: `conteudo/cursos/projeto-digital/03-2-provando-mux-tiny-tapeout.md`
- Criar: `conteudo/cursos/projeto-digital/03-2-provando-mux-tiny-tapeout.html`
- Criar: `conteudo/cursos/projeto-digital/quiz-03-1-temporizador-formal.json`
- Criar: `conteudo/cursos/projeto-digital/quiz-03-2-mux-tiny-tapeout.json`
- Modificar por geração: `conteudo/index.html`
- Modificar se houver observação real: `docs/course-authoring-improvements.md`

**Interfaces:**
- Consome: `https://github.com/mattvenn/formal_timer`, `https://github.com/mattvenn/tt-multiplexer`, a documentação estável do SBY em `https://yosyshq.readthedocs.io/projects/sby/en/stable/` e o registro `REFERENCIAS.md`.
- Produz: duas aulas em Markdown e HTML e dois quizzes de 3 questões.

- [ ] **Passo 1: Escrever a aula do temporizador formal**

Registre em `REFERENCIAS.md` os dois repositórios, a documentação do SBY e a data da consulta.

Use título `Provando o funcionamento de um temporizador`, slug `provando-um-temporizador`, ordem `03-1`, módulo `4. Verificação` e termos `Verilog`, `RTL`, `Yosys` e `Testbench`.

Explique a diferença entre simulação por exemplos e prova sobre todos os estados alcançáveis. Apresente o projeto `formal_timer`, o arquivo `.sby`, os modos `cover` e `prove`, a hipótese de reset, uma propriedade `cover` que alcança o fim da contagem e propriedades `assert` sobre contagem, término e limites. Mostre como ler PASS, FAIL e um contraexemplo. Inclua um marcador para o terminal com a prova passando e outro para uma onda de contraexemplo.

- [ ] **Passo 2: Escrever o quiz do temporizador**

Crie `quiz-03-1-temporizador-formal.json`, título `Quiz: prova formal do temporizador`, slug `quiz-verificacao-temporizador`, 70%, depois da aula 03-1.

As três questões avaliam:

1. pedir ao solver um exemplo de algo que pode ocorrer: `cover`;
2. declarar algo que deve valer em todos os casos cobertos: `assert`;
3. ferramenta aberta que coordena a prova com Yosys: SBY, também chamada SymbiYosys.

- [ ] **Passo 3: Escrever a aula do MUX do Tiny Tapeout**

Use título `Provando a segurança do MUX do Tiny Tapeout`, slug `provando-o-mux-do-tiny-tapeout`, ordem `03-2`, módulo `4. Verificação` e termos `Verilog`, `RTL`, `Yosys` e `Tape-out`.

O corpo apresenta o papel do multiplexador no chip compartilhado, clona `tt-multiplexer` no branch `start`, instala `py/requirements.txt`, identifica sinais de seleção e enable, escreve propriedades que provam que somente um projeto fica habilitado e que a seleção liga o projeto correto, roda o SBY e lê um contraexemplo. Inclua o cuidado de não confundir avisos do `pip` com falha da prova. Marque uma captura da arquitetura e outra do resultado formal.

- [ ] **Passo 4: Escrever o quiz do MUX**

Crie `quiz-03-2-mux-tiny-tapeout.json`, título `Quiz: segurança do MUX do Tiny Tapeout`, slug `quiz-seguranca-mux-tiny-tapeout`, 70%, depois da aula 03-2.

As três questões avaliam:

1. propriedade central: no máximo um projeto fica habilitado por vez;
2. opção que não é modo do SBY: `simulation`;
3. por que a prova formal ajuda em ASIC: acrescenta cobertura sobre estados que testes por exemplos podem não visitar.

- [ ] **Passo 5: Gerar e validar os arquivos do módulo**

Execute:

```bash
cd conteudo
node build.js
node -e 'const fs=require("fs"); for(const f of process.argv.slice(1)){const q=JSON.parse(fs.readFileSync(f)); if(q.nota_minima!==70) throw Error(`${f}: nota`); for(const [i,x] of q.questoes.entries()){if(x.alternativas.length!==4) throw Error(`${f}: questão ${i+1} sem 4 alternativas`); if(x.alternativas.filter(a=>a.correta).length!==1) throw Error(`${f}: questão ${i+1} sem resposta única`);}}' cursos/projeto-digital/quiz-03-1-temporizador-formal.json cursos/projeto-digital/quiz-03-2-mux-tiny-tapeout.json
```

Esperado: os dois HTMLs são regenerados, os quizzes passam sem saída e não aparecem avisos de elementos descartados pelo editor.

- [ ] **Passo 6: Cadastrar e recarregar o módulo**

No módulo `Verificação`, edite `Aulas em preparação` para virar a aula 03-1. Crie a aula 03-2. Em seguida, cadastre o quiz do temporizador depois da primeira aula e o quiz do MUX depois da segunda. Mantenha os quatro registros como rascunho e não use `Publicar módulo`.

Reabra os quatro formulários e confira corpo, posição, banco de perguntas, alternativa correta, nota mínima e publicação.

Esperado na conferência pública: aula, quiz, aula, quiz, todos `EM BREVE`, sem mudança no progresso.

- [ ] **Passo 7: Registrar somente melhorias observadas**

Use o mesmo critério da Tarefa 2. Uma ideia entra no documento apenas se surgiu de um caso concreto durante esta tarefa.

### Tarefa 4: Produzir o módulo LibreLane

**Arquivos:**
- Criar: `conteudo/cursos/projeto-digital/04-1-endurecendo-projeto-exemplo.md`
- Criar: `conteudo/cursos/projeto-digital/04-1-endurecendo-projeto-exemplo.html`
- Criar: `conteudo/cursos/projeto-digital/04-2-endurecendo-seu-projeto.md`
- Criar: `conteudo/cursos/projeto-digital/04-2-endurecendo-seu-projeto.html`
- Criar: `conteudo/cursos/projeto-digital/quiz-04-1-projeto-exemplo-librelane.json`
- Criar: `conteudo/cursos/projeto-digital/quiz-04-2-proprio-projeto-librelane.json`
- Modificar por geração: `conteudo/index.html`
- Modificar se houver observação real: `docs/course-authoring-improvements.md`

**Interfaces:**
- Consome: aula 15 de Educação, `https://github.com/librelane/librelane-ci-designs`, documentação estável do LibreLane e o ambiente `2026.08` do curso.
- Produz: duas aulas em Markdown e HTML, um quiz de 3 questões e um quiz de 4 questões.

- [ ] **Passo 1: Verificar o fluxo atual antes de redigir**

Confirme na documentação oficial:

- `librelane --run-example spm` para copiar e executar um exemplo;
- `librelane config.json` para um projeto próprio;
- fluxo padrão `Classic`;
- variáveis atuais de densidade, em especial `FP_CORE_UTIL` e `PL_TARGET_DENSITY_PCT`;
- localização do GDS, métricas e snapshots na versão instalada.

Registre as páginas consultadas, a data e os comandos adotados em `REFERENCIAS.md`.

Não ensine `flow.tcl` nem `-init_design_config`, que pertencem ao OpenLane antigo.

- [ ] **Passo 2: Escrever a aula do projeto de exemplo**

Use título `Endurecendo um projeto de exemplo`, slug `endurecendo-um-projeto-de-exemplo`, ordem `04-1`, módulo `5. LibreLane` e termos `LibreLane`, `Floorplan`, `Place and route`, `CTS`, `STA`, `GDSII` e `sky130`.

Apresente o fluxo RTL para GDS, escolha o `spm` oficial, leia o `config.json`, rode o exemplo, acompanhe as etapas, encontre métricas e resultados, abra o layout e use `summary.py`. Explique que uma execução simples leva minutos, mas o tempo varia por máquina e configuração. Inclua capturas do log, do resumo e do layout.

- [ ] **Passo 3: Escrever o quiz do exemplo**

Crie `quiz-04-1-projeto-exemplo-librelane.json`, título `Quiz: primeiro hardening com LibreLane`, slug `quiz-primeiro-hardening-librelane`, 70%, depois da aula 04-1.

As três questões avaliam:

1. ordem de grandeza para um hardening pequeno no ambiente atual: minutos, com cerca de 10 minutos como referência e aviso de variação;
2. executável que inicia o fluxo: `librelane`;
3. ferramenta que transforma Verilog em GDS no curso: LibreLane.

- [ ] **Passo 4: Escrever a aula do projeto próprio**

Use título `Endurecendo seu próprio projeto`, slug `endurecendo-seu-proprio-projeto`, ordem `04-2`, módulo `5. LibreLane` e os mesmos termos da aula anterior, acrescidos de `DRC` e `LVS`.

Parta de um projeto já simulado. Crie um `config.json` com `DESIGN_NAME`, `VERILOG_FILES`, `CLOCK_PORT`, `CLOCK_PERIOD`, `FP_CORE_UTIL` e `PL_TARGET_DENSITY_PCT`. Rode `librelane config.json`, leia falhas de síntese, timing e congestionamento, compare configurações, examine DRC e LVS, e execute simulação em nível de portas. Mostre que aumentar densidade reduz folga física e pode piorar roteamento. Inclua capturas de uma execução limpa, uma falha legível e a simulação em nível de portas.

- [ ] **Passo 5: Escrever o quiz do projeto próprio**

Crie `quiz-04-2-proprio-projeto-librelane.json`, título `Quiz: hardening do próprio projeto`, slug `quiz-hardening-proprio-projeto`, 70%, depois da aula 04-2.

As quatro questões avaliam:

1. densidade alvo de 100%: células sem folga prática para roteamento, uma configuração extrema;
2. significado de LVS: Layout Versus Schematic;
3. entrada usada pelo LibreLane atual para iniciar um projeto: arquivo `config.json`, em vez de `-init_design_config`;
4. momento da simulação em nível de portas: depois da síntese.

- [ ] **Passo 6: Gerar e validar os arquivos do módulo**

Execute:

```bash
cd conteudo
node build.js
node -e 'const fs=require("fs"); for(const f of process.argv.slice(1)){const q=JSON.parse(fs.readFileSync(f)); if(q.nota_minima!==70) throw Error(`${f}: nota`); for(const [i,x] of q.questoes.entries()){if(x.alternativas.length!==4) throw Error(`${f}: questão ${i+1} sem 4 alternativas`); if(x.alternativas.filter(a=>a.correta).length!==1) throw Error(`${f}: questão ${i+1} sem resposta única`);}}' cursos/projeto-digital/quiz-04-1-projeto-exemplo-librelane.json cursos/projeto-digital/quiz-04-2-proprio-projeto-librelane.json
```

Esperado: dois HTMLs regenerados, validação dos quizzes sem saída e nenhum aviso de conteúdo incompatível com o Lexical.

- [ ] **Passo 7: Cadastrar e recarregar o módulo**

No módulo `LibreLane`, transforme o placeholder na aula 04-1, crie a aula 04-2 e associe cada quiz à sua aula. Mantenha os quatro registros como rascunho. Reabra os formulários e confira todos os campos.

Durante a recarga, compare os comandos salvos com o Markdown, pois blocos de código são a parte mais sensível desta aula.

- [ ] **Passo 8: Registrar somente melhorias observadas**

Registre atritos concretos, especialmente perda de linguagem de bloco, dificuldade de comparar conteúdo salvo ou risco de publicação acidental.

### Tarefa 5: Produzir o módulo Chegando ao silício

**Arquivos:**
- Criar: `conteudo/cursos/projeto-digital/05-1-submetendo-ao-tiny-tapeout.md`
- Criar: `conteudo/cursos/projeto-digital/05-1-submetendo-ao-tiny-tapeout.html`
- Criar: `conteudo/cursos/projeto-digital/quiz-05-1-submissao-tiny-tapeout.json`
- Modificar por geração: `conteudo/index.html`
- Modificar se houver observação real: `docs/course-authoring-improvements.md`

**Interfaces:**
- Consome: aula 18 de Educação, `https://tinytapeout.com/specs/`, `https://tinytapeout.com/guides/local-hardening/`, `https://www.tinytapeout.com/guides/advanced-workshop/submit-your-design/` e o template SKY vigente.
- Produz: uma aula em Markdown e HTML e um quiz de 3 questões.

- [ ] **Passo 1: Conferir especificações e processo no dia da redação**

Confirme na documentação oficial:

- 8 entradas, 8 saídas e 8 GPIOs bidirecionais, além de `clk` e `rst_n`;
- capacidade aproximada de mil portas digitais por tile, descrita como ordem de grandeza;
- template SKY atual e campos vigentes de `info.yaml`;
- ações GDS e Docs exigidas pelo fluxo atual;
- sequência do portal: criar projeto, associar repositório, enviar uma revisão;
- comando local `./tt/tt_tool.py --harden` e teste em nível de portas.

Registre em `REFERENCIAS.md` as páginas de especificação, hardening local e submissão, com a data e os números adotados.

Não fixe prazo, preço ou quantidade exata de projetos de uma futura shuttle no texto.

- [ ] **Passo 2: Escrever a aula de submissão**

Use título `Submetendo um projeto ao Tiny Tapeout`, slug `submetendo-ao-tiny-tapeout`, ordem `05-1`, módulo `6. Chegando ao silício` e termos `Tiny Tapeout`, `Tape-out`, `Shuttle`, `GDSII`, `LibreLane`, `sky130` e `cocotb`, mantendo no front matter apenas slugs de wiki que existam.

O corpo deve cobrir:

1. diferença entre projeto, tile, chip e shuttle;
2. escolha do template SKY atual e criação do repositório;
3. adaptação do módulo para a interface Tiny Tapeout;
4. preenchimento de `info.yaml` e documentação;
5. testes RTL;
6. execução e leitura das GitHub Actions de GDS e Docs;
7. hardening local opcional com `tt_tool.py`;
8. teste em nível de portas;
9. criação do projeto no portal e envio de uma revisão;
10. atualização da revisão antes do fechamento da shuttle;
11. checklist final que termina antes de qualquer compra ou submissão real.

Inclua marcadores para `info.yaml`, ações verdes, render do GDS e tela do portal antes da confirmação final. O texto não deve mandar Paulo ou o estudante clicar em pagamento ou envio durante a revisão do rascunho.

- [ ] **Passo 3: Escrever o quiz de submissão**

Crie `quiz-05-1-submissao-tiny-tapeout.json`, título `Quiz: submissão ao Tiny Tapeout`, slug `quiz-submissao-tiny-tapeout`, 70%, depois da aula 05-1.

As três questões preservam a intenção da referência com fatos atuais:

1. capacidade de um tile: ordem de grandeza de mil portas digitais, sem chamar portas de células padrão;
2. GPIOs gerais disponíveis: 24, sendo 8 entradas, 8 saídas e 8 bidirecionais, sem contar `clk` e `rst_n`;
3. escala de projetos por chip: centenas. Entre as alternativas originais, 500 representa essa ordem de grandeza; a explicação deve avisar que o total real varia por shuttle e tamanho dos projetos.

- [ ] **Passo 4: Gerar e validar os arquivos do módulo**

Execute:

```bash
cd conteudo
node build.js
node -e 'const fs=require("fs"); for(const f of process.argv.slice(1)){const q=JSON.parse(fs.readFileSync(f)); if(q.nota_minima!==70) throw Error(`${f}: nota`); for(const [i,x] of q.questoes.entries()){if(x.alternativas.length!==4) throw Error(`${f}: questão ${i+1} sem 4 alternativas`); if(x.alternativas.filter(a=>a.correta).length!==1) throw Error(`${f}: questão ${i+1} sem resposta única`);}}' cursos/projeto-digital/quiz-05-1-submissao-tiny-tapeout.json
```

Esperado: o HTML é regenerado, o quiz passa sem saída e o build não avisa sobre conteúdo descartado pelo editor.

- [ ] **Passo 5: Cadastrar e recarregar o módulo**

No módulo `Chegando ao silício`, transforme o placeholder na aula 05-1 e cadastre o quiz depois dela. Mantenha ambos como rascunho. Reabra os dois formulários e confira os campos salvos.

Esperado no currículo público: duas atividades, aula e quiz, ambas `EM BREVE`, sem mudança no progresso.

- [ ] **Passo 6: Registrar somente melhorias observadas**

Registre qualquer dificuldade concreta de autoria ou revisão. Não registre mudanças no processo do Tiny Tapeout como defeito do site.

### Tarefa 6: Fazer a auditoria final do curso

**Arquivos:**
- Verificar: `conteudo/cursos/projeto-digital/02-*.md`
- Verificar: `conteudo/cursos/projeto-digital/03-*.md`
- Verificar: `conteudo/cursos/projeto-digital/04-*.md`
- Verificar: `conteudo/cursos/projeto-digital/05-*.md`
- Verificar: `conteudo/cursos/projeto-digital/quiz-0[2-5]-*.json`
- Verificar: `conteudo/cursos/projeto-digital/REFERENCIAS.md`
- Verificar: `docs/course-authoring-improvements.md`

**Interfaces:**
- Consome: os quatro módulos concluídos nas tarefas anteriores.
- Produz: curso pronto para revisão editorial, ainda sem publicação.

- [ ] **Passo 1: Regenerar todo o conteúdo local**

```bash
cd conteudo
node build.js
```

Esperado: geração completa sem erro e sem avisos nos sete novos Markdown.

- [ ] **Passo 2: Conferir inventário e marcadores de captura**

```bash
find cursos/projeto-digital -maxdepth 1 -type f \( -name '0[2-5]-*.md' -o -name 'quiz-0[2-5]-*.json' \) | sort
rg -n '^> \*\*IMAGEM\.\*\*' cursos/projeto-digital/0[2-5]-*.md
```

Esperado: sete Markdown, sete JSON e pelo menos um marcador específico de captura em cada aula.

- [ ] **Passo 3: Procurar texto inacabado ou conteúdo copiado**

```bash
rg -n "TBD|TODO|a definir|lorem|Captura pendente|Finish attempt|Mark .* as done" cursos/projeto-digital/0[2-5]-*.md cursos/projeto-digital/quiz-0[2-5]-*.json
```

Esperado: nenhuma ocorrência. Os únicos lembretes permitidos usam o padrão `> **IMAGEM.**`.

Faça também uma comparação manual por amostragem com o Zero to ASIC. Frases, explicações e alternativas não podem ser traduções literais.

- [ ] **Passo 4: Conferir a árvore administrativa inteira**

No painel, confirme:

- Construindo projetos digitais: 2 aulas e 2 quizzes;
- Verificação: 2 aulas e 2 quizzes;
- LibreLane: 2 aulas e 2 quizzes;
- Chegando ao silício: 1 aula e 1 quiz;
- cada quiz imediatamente depois da aula correspondente;
- todos os 14 registros como rascunho;
- nenhum placeholder restante.

- [ ] **Passo 5: Conferir o comportamento público**

Abra uma janela sem sessão administrativa e recarregue o curso. Esperado:

- módulos 3, 4 e 5 com quatro atividades cada;
- módulo 6 com duas atividades;
- todos os títulos visíveis como `EM BREVE` e sem links para corpos de rascunho;
- quizzes em rascunho respondem 404 em suas rotas públicas;
- progresso continua com o mesmo denominador anterior;
- aulas e quizzes já publicados de outros módulos continuam navegáveis.

- [ ] **Passo 6: Revisar o registro de melhorias**

Remova duplicatas, mantenha fatos observados e verifique que cada linha tem contorno e proposta. Não implemente as propostas nesta entrega.

Se o arquivo mudou, registre somente ele:

```bash
git add docs/course-authoring-improvements.md
git commit -m "docs(cursos): registrar atritos de autoria"
```

- [ ] **Passo 7: Entregar a revisão para Paulo**

Informe os 14 títulos, confirme que todos estão em rascunho, liste os marcadores de captura por aula e resuma as melhorias registradas. Deixe aberta a página pública do curso para a revisão. Não publique nenhum registro.
