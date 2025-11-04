# Gerenciamento de Variáveis de Ambiente (.env) no Projeto OpenSilício

## 📁 Localização do Arquivo .env

### ✅ Arquivo .env Único (`/.env` e `/.env.example`)
**Uso:** Produção, desenvolvimento e scripts

**Arquivos:**
- `.env` - Variáveis de ambiente para todos os ambientes (NÃO commitado no git)
- `.env.example` - Template com todas as variáveis necessárias (commitado no git)

**⚠️ IMPORTANTE:** Há apenas **UM** arquivo `.env` na raiz do projeto. Não use `.env` em subdiretórios.

**Variáveis Configuradas:**
```env
# Banco de Dados
POSTGRES_DB=opensilicio_prod
POSTGRES_USER=opensilicio
POSTGRES_PASSWORD=<senha_forte>
POSTGRES_PORT=5432

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=<secret_aleatorio_32_chars>
CORS_ORIGINS=http://localhost

# Admin
ADMIN_PASSWORD=<senha_admin_forte>

# Frontend
VITE_API_URL=http://localhost:3001/api
FRONTEND_PORT=80
```

**Usado por:**
- `docker-compose.prod.yml` - Define variáveis de ambiente para containers de produção
- Scripts de produção (`deploy.bat/sh`, `test-production.bat/sh`, etc.)
- Build do Docker (variáveis passadas como `--env-file`)

**Notas:**
- `DATABASE_URL` é construído automaticamente pelo `docker-compose` a partir das variáveis `POSTGRES_*`
- Para desenvolvimento local, o backend busca o `.env` **na raiz do projeto** (não em `/backend/`)
- Em Docker, as variáveis são passadas diretamente pelos arquivos `docker-compose`

---

## 🔄 Como as Variáveis são Carregadas

### No Docker (Produção)
1. **docker-compose.prod.yml** lê `.env` da raiz do projeto
2. Variáveis são passadas para os containers via `environment:` e `env_file:`
3. Backend e Frontend recebem variáveis como variáveis de ambiente do sistema

### No Docker (Desenvolvimento)
1. **docker-compose.dev.yml** define variáveis diretamente no arquivo
2. Não depende de arquivos `.env` externos
3. Variáveis estão hardcoded para desenvolvimento

### Desenvolvimento Local (Sem Docker)
1. Backend usa `dotenv.config()` em `server.ts` - procura `.env` no diretório de trabalho
   - **Execute sempre a partir da raiz do projeto** (ex: `npm run dev` na raiz)
   - O `.env` deve estar na raiz do projeto
2. Frontend usa variáveis via `import.meta.env.VITE_*` durante o build
3. Todas as variáveis vêm do arquivo `.env` da raiz do projeto

---

## 📝 Scripts que Usam .env

### Scripts de Produção (Raiz do Projeto)
- `scripts/production/deploy.bat/sh` - Verifica `.env` na raiz
- `scripts/production/update.bat/sh` - Usa `.env` da raiz
- `scripts/production/test-production.bat/sh` - Cria `.env.test.prod` temporário
- `scripts/production/validate-env.bat/sh` - Valida variáveis do `.env` da raiz

### Scripts do Backend
- `backend/src/server.ts` - Carrega `dotenv.config()` (procura `.env` no diretório atual)
- `backend/src/scripts/*.ts` - Alguns scripts carregam `.env` explicitamente

---

## ✅ Checklist de Configuração

### Para Produção:
- [ ] Copiar `.env.example` para `.env` na raiz do projeto
- [ ] Configurar `POSTGRES_PASSWORD` com senha forte
- [ ] Gerar `JWT_SECRET` aleatório (mínimo 32 caracteres)
- [ ] **Configurar `ADMIN_PASSWORD` com senha forte para o usuário admin**
- [ ] Configurar `VITE_API_URL` com URL real da API em produção
- [ ] Configurar `CORS_ORIGINS` com domínios permitidos
- [ ] Verificar que `.env` está no `.gitignore`

### Para Desenvolvimento Local:
- [ ] Usar o mesmo `.env` da raiz do projeto
- [ ] Configurar `DATABASE_URL` apontando para banco local ou Docker (se necessário)
- [ ] `NODE_ENV` deve ser `development` para desenvolvimento local

---

## 🚨 Problemas Comuns

### 1. Variáveis não carregadas no Docker
**Causa:** Arquivo `.env` não está na raiz do projeto ou não está sendo referenciado corretamente no `docker-compose.prod.yml`

**Solução:** 
- Verificar que `.env` existe na raiz
- Verificar que `docker-compose` está usando `--env-file .env` ou `env_file: .env`

### 2. Backend não encontra DATABASE_URL
**Causa:** Variável não está definida ou `DATABASE_URL` não está sendo construído corretamente

**Solução:**
- Verificar variáveis `POSTGRES_*` no `.env` da raiz
- `DATABASE_URL` é construído automaticamente pelo `docker-compose.prod.yml`

### 3. Frontend não conecta com API
**Causa:** `VITE_API_URL` está incorreto ou não foi configurado no build

**Solução:**
- Verificar `VITE_API_URL` no `.env` da raiz
- Rebuild do frontend após alterar `VITE_API_URL` (é variável de build-time)

---

## 📚 Referências

- `.env.example` na raiz - Template completo e único para o projeto
- `docker/docker-compose.prod.yml` - Como variáveis são passadas para containers em produção
- `docker/docker-compose.dev.yml` - Como variáveis são passadas para containers em desenvolvimento
- `backend/src/server.ts` - Como backend carrega variáveis (busca na raiz do projeto)

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite arquivos `.env` no git
- `.env` está no `.gitignore` mas `.env.example` pode ser commitado
- Use senhas fortes e secrets aleatórios em produção
- `JWT_SECRET` deve ter pelo menos 32 caracteres
- `POSTGRES_PASSWORD` deve ser uma senha forte

