# Estrutura de Arquivos .env no Projeto OpenSilício

## 📁 Localização dos Arquivos .env

### 1. Raiz do Projeto (`/.env` e `/.env.example`)
**Uso:** Produção e scripts de deploy

**Arquivos:**
- `.env` - Variáveis de ambiente para produção (NÃO commitado no git)
- `.env.example` - Template com todas as variáveis necessárias (commitado no git)

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

# Frontend
VITE_API_URL=http://localhost:3001/api
FRONTEND_PORT=80
```

**Usado por:**
- `docker-compose.prod.yml` - Define variáveis de ambiente para containers de produção
- Scripts de produção (`deploy.bat/sh`, `test-production.bat/sh`, etc.)
- Build do Docker (variáveis passadas como `--env-file`)

**Nota:** `DATABASE_URL` é construído automaticamente pelo `docker-compose.prod.yml` a partir das variáveis `POSTGRES_*`.

---

### 2. Backend (`/backend/.env` e `/backend/.env.example`)
**Uso:** Desenvolvimento local do backend

**Arquivos:**
- `.env` - Variáveis de ambiente para desenvolvimento local (NÃO commitado no git)
- `.env.example` - Template para desenvolvimento (commitado no git)

**Variáveis Configuradas:**
```env
DATABASE_URL=postgresql://admin:admin123@localhost:5432/opensilicio
JWT_SECRET=<secret_para_desenvolvimento>
PORT=3001
NODE_ENV=development
```

**Usado por:**
- `backend/src/server.ts` - Carrega via `dotenv.config()` quando executado localmente
- Scripts do backend quando executados diretamente (sem Docker)
- Desenvolvimento local sem Docker

**Nota:** Quando o backend roda no Docker, as variáveis são passadas pelo `docker-compose`, não pelo arquivo `.env`.

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
1. Backend usa `dotenv.config()` em `server.ts` para carregar `/backend/.env`
2. Frontend usa variáveis via `import.meta.env.VITE_*` durante o build
3. Variáveis devem estar disponíveis no ambiente onde o código roda

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
- [ ] Configurar `VITE_API_URL` com URL real da API em produção
- [ ] Configurar `CORS_ORIGINS` com domínios permitidos
- [ ] Verificar que `.env` está no `.gitignore`

### Para Desenvolvimento Local:
- [ ] Copiar `backend/.env.example` para `backend/.env`
- [ ] Configurar `DATABASE_URL` apontando para banco local ou Docker
- [ ] Configurar outras variáveis conforme necessário

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

- `.env.example` na raiz - Template completo para produção
- `backend/.env.example` - Template para desenvolvimento local
- `docker/docker-compose.prod.yml` - Como variáveis são passadas para containers
- `backend/src/server.ts` - Como backend carrega variáveis

---

## 🔐 Segurança

⚠️ **IMPORTANTE:**
- Nunca commite arquivos `.env` no git
- `.env` está no `.gitignore` mas `.env.example` pode ser commitado
- Use senhas fortes e secrets aleatórios em produção
- `JWT_SECRET` deve ter pelo menos 32 caracteres
- `POSTGRES_PASSWORD` deve ser uma senha forte

