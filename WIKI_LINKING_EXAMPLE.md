# Como Usar Links da Wiki

## Visão Geral

O sistema de links da Wiki permite que você conecte termos técnicos nos posts do blog e recursos educacionais diretamente às suas definições na Wiki.

## Como Funciona

### 1. No Editor (Painel Administrativo)

1. **Acesse o painel administrativo** (`/admin`)
2. **Crie ou edite um post/recurso**
3. **No editor rico**, você verá um botão "Link da Wiki" na toolbar
4. **Selecione o texto** que deseja vincular (opcional)
5. **Clique no botão "Link da Wiki"**
6. **Escolha o termo** da lista de entradas da Wiki
7. **O link será inserido automaticamente**

### 2. Tipos de Conteúdo Suportados

- **WYSIWYG**: Links são inseridos como links HTML normais
- **Markdown**: Links são inseridos como `[Texto](/wiki/slug)`

### 3. Na Visualização Pública

- **Links da Wiki** aparecem com estilo diferenciado
- **Tooltip** mostra "Ver definição na Wiki"
- **Clique** leva diretamente para a página da Wiki
- **Links externos** funcionam normalmente

## Exemplo Prático

### Criando uma Entrada na Wiki

1. Acesse `/admin/wiki/new`
2. Preencha:
   - **Termo**: "CMOS"
   - **Slug**: "cmos"
   - **Definição**: "Complementary Metal-Oxide-Semiconductor - tecnologia de fabricação de circuitos integrados"
   - **Conteúdo**: Detalhes técnicos sobre CMOS...
3. **Publique** a entrada

### Criando um Post com Link para a Wiki

1. Acesse `/admin/blog/new`
2. **Escreva o conteúdo**:
   ```
   Os circuitos CMOS são amplamente utilizados em eletrônica digital...
   ```
3. **Selecione "CMOS"** no texto
4. **Clique em "Link da Wiki"**
5. **Escolha "CMOS"** da lista
6. **O texto "CMOS"** agora é um link para `/wiki/cmos`

### Resultado

- **No editor**: `CMOS` aparece como link
- **Na visualização**: `CMOS` aparece destacado com tooltip
- **Ao clicar**: Usuário vai para `/wiki/cmos` com a definição completa

## Funcionalidades Técnicas

### Componentes Criados

1. **`WikiLinkInserter`**: Modal para escolher termos da Wiki
2. **`WikiLinkRenderer`**: Renderiza links da Wiki com estilo especial
3. **Integração no `RichTextEditor`**: Botão na toolbar

### Banco de Dados

- **Tabela `wiki_entries`**: Armazena termos e definições
- **Tabela `content_wiki_links`**: Armazena associações (futuro)
- **Links são armazenados** diretamente no conteúdo como HTML/Markdown

### URLs Suportadas

- **Links da Wiki**: `/wiki/slug` → Renderizados com estilo especial
- **Links externos**: `https://...` → Funcionam normalmente
- **Links internos**: `/blog/slug` → Funcionam normalmente

## Benefícios

1. **Contexto imediato**: Usuários podem entender termos técnicos rapidamente
2. **Navegação fluida**: Links levam diretamente às definições
3. **Consistência**: Todos os termos técnicos podem ter definições padronizadas
4. **Facilidade de uso**: Interface simples para administradores

## Limitações Atuais

1. **Links são armazenados** diretamente no conteúdo (não há tabela de associações)
2. **Não há validação** se o termo da Wiki existe quando o link é criado
3. **Links quebrados** não são detectados automaticamente

## Próximos Passos

1. **Implementar tabela `content_wiki_links`** para rastrear associações
2. **Validação de links** no momento da criação
3. **Relatórios** de termos mais vinculados
4. **Sugestões automáticas** de termos relacionados
