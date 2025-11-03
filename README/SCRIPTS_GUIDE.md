# Guia de Scripts - OpenSilício

Scripts organizados em **Development** (desenvolvimento) e **Production** (produção).

## 📂 Estrutura

```
scripts/
├── development/          # Scripts de desenvolvimento
│   ├── start.bat        # Iniciar com Docker + hot reload (Windows)
│   ├── start.sh         # Iniciar com Docker + hot reload (Linux/Mac)
│   ├── local.bat        # Desenvolvimento local sem Docker (Windows)
│   ├── local.sh         # Desenvolvimento local sem Docker (Linux/Mac)
│   ├── stop.bat         # Parar todos os serviços (Windows)
│   └── stop.sh          # Parar todos os serviços (Linux/Mac)
│
└── production/          # Scripts de produção
    ├── quick-start.bat  # Deploy rápido inicial (Windows)
    ├── quick-start.sh   # Deploy rápido inicial (Linux/Mac)
    ├── deploy.bat       # Deploy inicial em produção (Windows)
    ├── deploy.sh        # Deploy inicial em produção (Linux/Mac)
    ├── update.bat       # Atualizar aplicação em produção (Windows)
    ├── update.sh        # Atualizar aplicação em produção (Linux/Mac)
    ├── backup.bat       # Criar backup do banco de dados (Windows)
    ├── backup.sh        # Criar backup do banco de dados (Linux/Mac)
    ├── restore.bat      # Restaurar backup do banco (Windows)
    ├── restore.sh       # Restaurar backup do banco (Linux/Mac)
    ├── validate-env.bat # Validar variáveis de ambiente (Windows)
    ├── validate-env.sh  # Validar variáveis de ambiente (Linux/Mac)
    ├── test-production.bat # Teste completo de produção (Windows)
    ├── test-production.sh  # Teste completo de produção (Linux/Mac)
    └── migrate.bat      # Executar migrações do banco (Windows)
```

## 🚀 Scripts de Desenvolvimento

### start - Desenvolvimento com Docker (Recomendado)

Inicia todos os serviços (frontend, backend, database) em Docker com **hot reload**.

```bash
# Windows
scripts\development\start.bat

# Linux/Mac
chmod +x scripts/development/start.sh
./scripts/development/start.sh
```

**Características:**
- ✅ Hot reload no backend (~2s para detectar mudanças)
- ✅ HMR no frontend (instantâneo)
- ✅ Banco de dados PostgreSQL isolado
- ✅ Ambiente idêntico à produção

**Acesse:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- PostgreSQL: localhost:5432

### local - Desenvolvimento Local

Roda frontend e backend localmente (sem Docker). **Requer Node.js instalado**.

```bash
# Windows
scripts\development\local.bat

# Linux/Mac
chmod +x scripts/development/local.sh
./scripts/development/local.sh
```

**Quando usar:**
- Problemas com Docker
- Desenvolvimento offline
- Debugging mais direto

### stop - Parar Serviços

Para todos os containers Docker.

```bash
# Windows
scripts\development\stop.bat

# Linux/Mac
chmod +x scripts/development/stop.sh
./scripts/development/stop.sh
```

**Nota:** Seus dados permanecem seguros nos volumes Docker!

## 🏭 Scripts de Produção

### quick-start - Deploy Rápido (Novo!)

Script simplificado para primeiro deploy em produção. Ideal para quem está fazendo deploy pela primeira vez.

```bash
# Windows
scripts\production\quick-start.bat

# Linux/Mac
chmod +x scripts/production/quick-start.sh
./scripts/production/quick-start.sh
```

**O que faz:**
1. ✅ Verifica se `.env` existe (cria de `.env.example` se necessário)
2. ✅ Abre `.env` para edição
3. ✅ Valida variáveis de ambiente obrigatórias
4. ✅ Executa deploy completo

**Quando usar:**
- Primeiro deploy em produção
- Configuração inicial do ambiente

### validate-env - Validar Variáveis de Ambiente

Valida se todas as variáveis de ambiente obrigatórias estão configuradas corretamente.

```bash
# Windows
scripts\production\validate-env.bat

# Linux/Mac
chmod +x scripts/production/validate-env.sh
./scripts/production/validate-env.sh
```

**O que valida:**
- `POSTGRES_PASSWORD` (obrigatório)
- `JWT_SECRET` (obrigatório, mínimo 32 caracteres)
- `VITE_API_URL` (obrigatório)
- `POSTGRES_DB` (opcional, padrão: opensilicio_prod)
- `POSTGRES_USER` (opcional, padrão: opensilicio)
- `CORS_ORIGINS` (opcional)

**Nota:** `DATABASE_URL` é construído automaticamente e não precisa ser validado.

### deploy - Deploy Inicial

Faz o deploy completo da aplicação em produção pela primeira vez.

```bash
# Windows
scripts\production\deploy.bat

# Linux/Mac
chmod +x scripts/production/deploy.sh
./scripts/production/deploy.sh
```

**O que faz:**
1. ✅ Verifica arquivo `.env`
2. ✅ Valida variáveis de ambiente obrigatórias
3. ✅ Para containers existentes
4. ✅ Constrói imagens de produção otimizadas
5. ✅ Inicia containers usando `docker-compose.prod.yml`
6. ✅ Executa migrações do banco automaticamente
7. ✅ Oferece criar usuário admin e configurações iniciais
8. ✅ Pronto para uso!

**Melhorias:**
- Frontend servido via Nginx (não Vite dev server)
- Build otimizado de produção
- Validação de ambiente antes do deploy
- DATABASE_URL construído automaticamente

**Pré-requisitos:**
- Arquivo `.env` configurado (o script cria um template se não existir)
- Docker rodando

### update - Atualizar Produção

Atualiza a aplicação em produção com as últimas mudanças do código.

```bash
# Windows
scripts\production\update.bat

# Linux/Mac
chmod +x scripts/production/update.sh
./scripts/production/update.sh
```

**O que faz:**
1. ✅ **Cria backup automático** do banco (se falhar, aborta!)
2. ✅ Atualiza código do repositório
3. ✅ Para containers
4. ✅ Reconstrói imagens de produção
5. ✅ Reinicia containers usando `docker-compose.prod.yml`
6. ✅ Executa novas migrações automaticamente

**Segurança:**
- Backup automático antes de qualquer mudança
- Se o backup falhar, a atualização é abortada
- Dados permanecem seguros em volumes Docker

### backup - Backup do Banco de Dados

Cria um backup manual do banco de dados PostgreSQL.

```bash
# Windows
scripts\production\backup.bat

# Linux/Mac
chmod +x scripts/production/backup.sh
./scripts/production/backup.sh
```

**Arquivo gerado:**
```
backups/backup_YYYYMMDD_HHMMSS.sql
```

**Exemplo:**
```
backups/backup_20250121_143052.sql
```

**Quando usar:**
- Antes de grandes mudanças manuais no banco
- Backup adicional para segurança extra
- Antes de testes arriscados

### restore - Restaurar Backup

Restaura o banco de dados a partir de um backup.

```bash
# Windows
scripts\production\restore.bat backups\backup_20250121_143052.sql

# Linux/Mac
chmod +x scripts/production/restore.sh
./scripts/production/restore.sh backups/backup_20250121_143052.sql
```

**⚠️ ATENÇÃO:**
- Isso **substitui todos os dados atuais**!
- Requer confirmação digitando "SIM"
- Não há desfazer

**Quando usar:**
- Recuperação de erro crítico
- Restaurar estado anterior conhecido
- Reverter mudanças problemáticas

### migrate - Executar Migrações

Executa migrações pendentes do banco de dados.

```bash
# Windows
scripts\production\migrate.bat
```

**O que faz:**
- Executa arquivos SQL em `backend/src/migrations/`
- Cria tabelas, índices, constraints
- Versiona o esquema do banco

**Quando usar:**
- Após atualizar o código
- Depois de adicionar novas migrations
- Para configurar banco novo

### test-production - Teste Completo de Produção

Testa o ambiente de produção completo: cria dados de teste, executa testes, aplica migrações e verifica se os dados foram preservados.

```bash
# Windows
scripts\production\test-production.bat

# Linux/Mac
chmod +x scripts/production/test-production.sh
./scripts/production/test-production.sh
```

**O que faz:**
1. ✅ Cria backup inicial do banco
2. ✅ Inicia ambiente de produção completo
3. ✅ Executa migrações iniciais
4. ✅ Cria usuário admin
5. ✅ Cria dados de teste (blog posts, education resources, wiki entries, settings)
6. ✅ Salva snapshot dos dados criados
7. ✅ Executa testes de integração
8. ✅ Executa migrações pendentes
9. ✅ Verifica integridade dos dados (contagem + conteúdo)
10. ✅ Gera relatório de verificação
11. ✅ Oferece opção de limpeza no final

**Arquivos gerados:**
- `test-data-snapshot.json` - Snapshot dos dados criados antes da migração
- `test-integrity-report.json` - Relatório completo da verificação de integridade
- `backups/backup_before_test_*.sql` - Backup criado antes do teste

**Quando usar:**
- Antes de fazer deploy em produção
- Após criar novas migrações para garantir que não quebram dados existentes
- Para validar que o ambiente de produção está funcionando corretamente
- Antes de atualizar produção após mudanças significativas

**Nota:** O script mantém o ambiente rodando ao final para inspeção manual. Você pode escolher limpar tudo ou manter para verificar os dados.

## 📋 Fluxos Comuns

### Primeiro Deploy

```bash
# Opção 1: Quick Start (mais fácil)
scripts/production/quick-start.sh  # ou quick-start.bat no Windows

# Opção 2: Manual
# 1. Configurar ambiente
# Edite .env com suas senhas e configurações
# (lembre-se: DATABASE_URL é construído automaticamente!)

# 2. Validar ambiente (opcional mas recomendado)
scripts/production/validate-env.sh

# 3. Deploy
scripts/production/deploy.sh

# 4. Verificar
docker-compose -f docker/docker-compose.prod.yml logs -f
```

### Desenvolvimento Diário

```bash
# Iniciar
scripts/development/start.sh

# Trabalhar...
# Hot reload detecta mudanças automaticamente

# Parar (fim do dia)
scripts/development/stop.sh
```

### Atualização em Produção

```bash
# 1. Fazer commit das mudanças
git add .
git commit -m "Feature XYZ"
git push origin main

# 2. No servidor, atualizar (backup automático incluído)
scripts/production/update.sh  # ou update.bat no Windows

# 3. Verificar
docker-compose -f docker/docker-compose.prod.yml ps
docker-compose -f docker/docker-compose.prod.yml logs -f
```

### Backup Antes de Mudança Arriscada

```bash
# 1. Criar backup
scripts/production/backup.sh

# 2. Fazer mudanças...

# 3. Se der errado, restaurar
scripts/production/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql
```

### Testar Produção Antes de Deploy

```bash
# 1. Executar teste completo de produção
scripts/production/test-production.sh  # ou test-production.bat no Windows

# 2. Verificar relatório gerado
cat test-integrity-report.json

# 3. Se tudo estiver OK, fazer deploy real
scripts/production/deploy.sh
```

## 🔧 Troubleshooting

### Script não executa (Linux/Mac)

```bash
# Dar permissão de execução
chmod +x scripts/development/*.sh
chmod +x scripts/production/*.sh
```

### Docker não está rodando

```bash
# Iniciar Docker Desktop ou serviço
# Windows: Abrir Docker Desktop
# Linux: sudo systemctl start docker
```

### Porta já em uso

```bash
# Parar serviços existentes
scripts/development/stop.sh

# Ou identificar processo usando a porta
# Linux/Mac:
lsof -i :5173
lsof -i :3001

# Windows:
netstat -ano | findstr :5173
netstat -ano | findstr :3001
```

### Backup falha

```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker/docker-compose.prod.yml ps postgres

# Verificar logs
docker-compose -f docker/docker-compose.prod.yml logs postgres

# Verificar variáveis de ambiente (certifique-se de que POSTGRES_USER e POSTGRES_DB estão corretos)
scripts/production/validate-env.sh
```

## 💡 Dicas

### Alias para scripts frequentes

**Linux/Mac** (`~/.bashrc` ou `~/.zshrc`):
```bash
alias osdev='cd ~/opensilicio && ./scripts/development/start.sh'
alias osstop='cd ~/opensilicio && ./scripts/development/stop.sh'
alias osbackup='cd ~/opensilicio && ./scripts/production/backup.sh'
```

**Windows** (PowerShell profile):
```powershell
function osdev { cd C:\opensilicio; .\scripts\development\start.bat }
function osstop { cd C:\opensilicio; .\scripts\development\stop.bat }
```

### Backup automático agendado

Configure cron (Linux) ou Task Scheduler (Windows) para executar `scripts/production/backup.sh` diariamente.

Ver [DATA_SAFETY.md](DATA_SAFETY.md) para mais detalhes.

## 📞 Precisa de Ajuda?

- **Documentação completa**: [README.md](README.md)
- **Deploy em produção**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Segurança de dados**: [DATA_SAFETY.md](DATA_SAFETY.md)
- **Issues no GitHub**: Relate problemas ou dúvidas

---

**OpenSilício** - Scripts bem organizados para desenvolvimento ágil! 🚀

