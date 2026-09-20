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
| 2026-09-20 | Gerador de conteúdo de cursos | `build.js` tenta converter todo arquivo `.md` da pasta do curso em aula e falha se o arquivo for uma nota sem front matter. | Autor não consegue manter referências ou anotações junto das aulas. | Guardar o registro na raiz de `conteudo/`, fora da pasta varrida. | Processar apenas Markdown com front matter de conteúdo ou ignorar nomes reservados como `README.md` e `REFERENCIAS.md`. | Média |
| 2026-09-20 | Editor de aulas | A colagem automatizada de HTML pode inserir as tags como texto literal, embora a mesma origem funcione ao copiar a página renderizada e colar com atalhos reais. | Autor corre o risco de salvar uma aula visualmente corrompida quando importa conteúdo extenso. | Abrir o HTML gerado, selecionar o corpo renderizado, copiar e colar no editor; recarregar após salvar para confirmar a estrutura persistida. | Oferecer importação de HTML no próprio editor, com pré-visualização e validação antes de substituir o conteúdo. | Alta |
| 2026-09-20 | Editor de quizzes | Cada questão precisa ser criada e preenchida individualmente em seis campos, mesmo quando o banco já existe em formato estruturado. | A criação de quizzes longos é lenta e sujeita a campos incompletos ou alternativas corretas marcadas no lugar errado. | Preencher em blocos pequenos e revisar enunciado, explicação e alternativa correta de cada questão antes de salvar. | Permitir importar e exportar um quiz em JSON validado, mostrando um resumo das questões antes da confirmação. | Média |
| 2026-09-20 | Editor do laboratório PWM | A configuração inteira do laboratório entra em um único `window.prompt` como JSON5 multilinha. Funciona para o piloto, mas erros de aspas ou estrutura só aparecem após confirmar o diálogo. | Autor precisa revisar uma estrutura longa sem campos, validação durante a edição ou pré-visualização. | Usar o exemplo validado, alterar um campo por vez e corrigir pelo erro localizado do widget. | Painel de propriedades com campos para pergunta, alternativas e medidas, mantendo JSON5 como modo avançado. | Baixa |
