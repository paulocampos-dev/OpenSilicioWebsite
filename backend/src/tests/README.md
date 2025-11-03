# Guia de Testes

## Visão Geral

Este diretório contém testes de integração para a API OpenSilício. Os testes são projetados para espelhar como o frontend usa os endpoints da API, garantindo compatibilidade e correção.

## Executando Testes

### Todos os Testes
```bash
npm test
```

### Modo Watch (para desenvolvimento)
```bash
npm run test:watch
```

### Relatório de Cobertura
```bash
npm run test:coverage
```

### Apenas Testes de Integração
```bash
npm run test:integration
```

## Estrutura dos Testes

Os testes estão organizados no diretório `integration/`:

- `auth.test.ts` - Endpoints de autenticação (login, verify)
- `blog.test.ts` - Endpoints de posts do blog (GET, POST, PUT)
- `education.test.ts` - Endpoints de recursos educacionais (GET, POST, PUT)
- `wiki.test.ts` - Endpoints de entradas da wiki (GET, POST, PUT)
- `settings.test.ts` - Endpoints de configurações do site (GET, PUT)

## Banco de Dados de Teste

Os testes usam um banco de dados de teste separado. Configure usando:

- Variável de ambiente `TEST_DATABASE_URL`, ou
- Padrão: `postgresql://admin:admin123@localhost:5432/opensilicio_test`

Certifique-se de que o banco de dados de teste existe e as migrações foram executadas:

```bash
# Criar banco de dados de teste
createdb opensilicio_test

# Executar migrações no banco de teste
DATABASE_URL=postgresql://admin:admin123@localhost:5432/opensilicio_test npm run migrate
```

## Utilitários de Teste

### Utilitários de Autenticação (`utils/auth.ts`)
- `getAuthToken()` - Obter token de autenticação para testes
- `authenticatedRequest()` - Criar helpers de requisição autenticada

### Utilitários de Ajuda (`utils/helpers.ts`)
- `createTestBlogPost()` - Criar dados de teste para blog post
- `createTestEducationResource()` - Criar dados de teste para recurso educacional
- `createTestWikiEntry()` - Criar dados de teste para entrada da wiki
- `createTestSiteSettings()` - Criar dados de teste para configurações do site
- `cleanDatabase()` - Limpar tabelas do banco de dados de teste

## Escrevendo Novos Testes

1. Crie um novo arquivo de teste no diretório `integration/`
2. Importe os utilitários necessários:
   ```typescript
   import request from 'supertest';
   import app from '../../server';
   import { cleanDatabase, createTestXXX } from '../utils/helpers';
   import { getAuthToken } from '../utils/auth';
   ```

3. Use a estrutura padrão:
   ```typescript
   describe('API Endpoint', () => {
     beforeEach(async () => {
       await cleanDatabase();
     });

     describe('GET endpoints', () => {
       // Testar requisições GET
     });

     describe('POST/PUT endpoints', () => {
       // Testar operações de salvamento
     });
   });
   ```

4. Teste se a estrutura da resposta corresponde às expectativas do frontend
5. Teste requisitos de autenticação
6. Teste casos de erro

## Princípios dos Testes

1. **Espelhar Uso do Frontend** - Testes usam endpoints exatamente como o frontend faz
2. **Simples e Rápido** - Testes executam rapidamente (< 30 segundos no total)
3. **Focado** - Testa apenas caminhos críticos
4. **Isolado** - Cada teste é independente
5. **Realista** - Usa estrutura real de requisição/resposta

## Notas

- Os testes limpam automaticamente o banco de dados entre suites de teste
- O usuário admin de teste (AdmOpen/ADMOpenSilicio123!@2025) é criado automaticamente
- Os testes executam em ambiente de teste (NODE_ENV=test)
- A saída do console é suprimida durante os testes, a menos que esteja em modo debug
