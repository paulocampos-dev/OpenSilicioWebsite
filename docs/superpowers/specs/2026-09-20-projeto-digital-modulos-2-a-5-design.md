# Projeto Digital: conteúdo dos módulos 2 a 5

**Data:** 2026-09-20

**Status:** aprovado

## Objetivo

Completar o curso Projeto Digital depois do módulo de MOSFETs. O trabalho cobre
as aulas e os quizzes dos quatro módulos restantes. Todos os novos registros
ficam como rascunho para Paulo revisar, executar os exemplos e acrescentar suas
próprias capturas de tela antes da publicação.

O Zero to ASIC 2025 é a referência pedagógica, usada com permissão. O texto não
será uma tradução literal. A versão do OpenSilício deve preservar a sequência e
os conceitos, mas usar português brasileiro, o ambiente já adotado pelo curso e
explicações próprias.

## Inventário

| Módulo do OpenSilício | Aulas | Quizzes |
|---|---|---|
| Construindo projetos digitais | Misturador de cores RGB; Contador de frequência | 2 |
| Verificação | Provando o funcionamento de um temporizador; Provando a segurança do MUX do Tiny Tapeout | 2 |
| LibreLane | Endurecendo um projeto de exemplo; Endurecendo seu próprio projeto | 2 |
| Chegando ao silício | Submetendo um projeto ao Tiny Tapeout | 1 |

Total previsto: sete aulas e sete quizzes.

As páginas de recursos do curso de referência serão incorporadas ao fim da aula
correspondente. O OpenSilício não criará uma atividade separada apenas para uma
lista de links.

## Ordem de execução

O trabalho seguirá a ordem dos módulos. Cada módulo será concluído e validado
antes do próximo:

1. escrever as fontes das aulas e quizzes;
2. gerar o HTML das aulas;
3. cadastrar ou atualizar os registros pelo painel administrativo;
4. recarregar cada registro e conferir o que o servidor guardou;
5. conferir a ordem pública e confirmar que tudo continua como "em breve".

Paulo não precisa revisar entre módulos. O trabalho só pausa se faltar acesso,
se uma decisão mudar o conteúdo técnico ou se o site impedir um salvamento
seguro.

## Adaptação das aulas

Cada aula terá uma progressão curta e prática:

- objetivo e resultado esperado;
- conceito necessário para entender o exercício;
- implementação em etapas;
- comandos ou trechos de código explicados;
- como verificar o resultado;
- erros comuns;
- recursos e próximos passos.

O texto deve ser suficiente para acompanhar a atividade sem o vídeo original.
Comandos, nomes de arquivos e versões devem seguir o ambiente do OpenSilício.
Quando o material de referência e o nosso ambiente discordarem, o OpenSilício
vence. Informações que possam ter mudado, em especial LibreLane e Tiny Tapeout,
serão conferidas na documentação oficial antes de entrar no rascunho.

As capturas do curso original não serão copiadas. O Markdown usará lembretes
visíveis no rascunho no formato `> **IMAGEM.** ...`, descrevendo exatamente o
que Paulo deve registrar. Esses lembretes precisam ser substituídos ou
removidos antes da publicação da aula.

## Fontes locais

As fontes continuam em `conteudo/cursos/projeto-digital/`, uma por aula. O nome
segue a ordem do curso, por exemplo `02-1-misturador-rgb.md`. O front matter usa
os campos existentes: `ordem`, `modulo`, `titulo`, `slug`, `video`, `opcional` e
`termos_wiki`.

Cada quiz terá um JSON ao lado das aulas, seguindo o formato já usado em
`quiz-01-*.json`. O arquivo registra título, slug, nota mínima e banco de
questões. `node build.js` em `conteudo/` continua sendo a única etapa de geração
dos corpos HTML.

## Uso dos registros existentes

Cada módulo já contém a aula em rascunho "Aulas em preparação". Ela será editada
para se tornar a primeira aula real do módulo. Isso preserva a posição e evita
excluir registros. As demais aulas serão criadas como rascunho.

Os quizzes serão associados às aulas correspondentes. O quiz da primeira aula
fica depois dela; o quiz da segunda aula fica depois da segunda. No módulo final,
o único quiz fica depois da aula de submissão.

O curso permanece publicado. Somente as novas aulas e quizzes continuam com
`publicado = false`. Por isso os títulos aparecem no currículo público como
"em breve", sem corpo, slug do rascunho, perguntas ou impacto no progresso.

## Quizzes

Os sete quizzes preservam os assuntos e a intenção das perguntas do Zero to
ASIC. A redação, as alternativas e as explicações serão próprias e coerentes com
as aulas do OpenSilício.

Regras para cada quiz:

- nota mínima de 70%;
- tentativas ilimitadas;
- nenhuma trava de navegação;
- todas as perguntas relevantes da referência, sem reduzir automaticamente a
  quatro questões;
- quatro alternativas por pergunta e uma resposta correta;
- explicação curta depois da correção;
- nenhuma tentativa enviada no curso de referência.

Quando a referência tiver menos de quatro alternativas, será adicionado um
distrator plausível. Perguntas presas a comandos antigos serão atualizadas para
o fluxo ensinado na nossa aula, sem mudar o conceito avaliado.

## Links e termos técnicos

Links internos só podem apontar para rotas que existam no OpenSilício. Termos da
wiki serão marcados no texto quando o verbete já existir. `termos_wiki` continua
como uma lista editorial, não como fonte da associação no banco.

Links externos devem priorizar documentação oficial e páginas estáveis. Links do
curso de referência, canais de comunidade e recursos comerciais só entram se
forem necessários para executar a atividade.

## Registro de melhorias

Durante a produção, qualquer atrito real no site, no painel ou no editor será
registrado em `docs/course-authoring-improvements.md`. Cada observação deve
trazer o contexto em que apareceu, o impacto para autor ou estudante, o
contorno usado nesta rodada e uma proposta curta de melhoria.

Esse registro não autoriza mudanças de produto dentro desta entrega. Ele serve
como uma fila concreta para decisões futuras, sem misturar melhorias desejáveis
com o trabalho necessário para terminar o curso.

## Validação

Antes de cadastrar:

- gerar todos os HTMLs sem erro;
- validar o front matter das sete aulas;
- validar que cada questão tem quatro alternativas e uma correta;
- revisar comandos, links e slugs;
- procurar lembretes incompletos ou texto copiado literalmente.

Depois de cadastrar:

- recarregar cada aula e quiz no painel e conferir título, módulo, posição,
  corpo, alternativas, resposta correta, explicação e estado de publicação;
- confirmar que o currículo público mostra a ordem planejada;
- confirmar que aulas e quizzes aparecem como "em breve";
- confirmar que o denominador do progresso não mudou;
- confirmar que as rotas públicas dos quizzes em rascunho respondem 404;
- manter uma aba do curso aberta para a revisão de Paulo.

## Fora do escopo

- publicar qualquer aula ou quiz;
- copiar screenshots, vídeos ou texto do curso de referência;
- alterar o sistema de cursos, o editor ou o modelo de quizzes;
- criar contas, certificados ou novas regras de progresso;
- executar uma submissão real ao Tiny Tapeout;
- enviar respostas ou finalizar tentativas no curso de referência.

## Critérios de conclusão

O trabalho termina quando as sete aulas e os sete quizzes existem no curso
Projeto Digital, estão na ordem correta, permanecem em rascunho e foram
conferidos contra o estado salvo. As fontes locais devem corresponder ao conteúdo
do painel. O currículo público deve continuar navegável e o progresso dos
leitores não pode mudar.
