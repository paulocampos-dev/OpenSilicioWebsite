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
    ├── deploy.bat       # Deploy inicial em produção (Windows)
    ├── deploy.sh        # Deploy inicial em produção (Linux/Mac)
    ├── update.bat       # Atualizar aplicação em produção (Windows)
    ├── update.sh        # Atualizar aplicação em produção (Linux/Mac)
    ├── backup.bat       # Criar backup do banco de dados (Windows)
    ├── backup.sh        # Criar backup do banco de dados (Linux/Mac)
    ├── restore.bat      # Restaurar backup do banco (Windows)
    ├── restore.sh       # Restaurar backup do banco (Linux/Mac)
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
2. ✅ Para containers existentes
3. ✅ Constrói imagens de produção
4. ✅ Inicia containers
5. ✅ Executa migrações do banco
6. ✅ Pronto para uso!

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
4. ✅ Reconstrói imagens
5. ✅ Reinicia containers
6. ✅ Executa novas migrações

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

## 📋 Fluxos Comuns

### Primeiro Deploy

```bash
# 1. Configurar ambiente
# Edite .env com suas senhas e configurações

# 2. Deploy
scripts/production/deploy.sh

# 3. Verificar
docker-compose -f docker/docker-compose.yml logs -f
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

# 2. No servidor, atualizar
scripts/production/update.sh

# 3. Verificar
docker-compose -f docker/docker-compose.yml ps
```

### Backup Antes de Mudança Arriscada

```bash
# 1. Criar backup
scripts/production/backup.sh

# 2. Fazer mudanças...

# 3. Se der errado, restaurar
scripts/production/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql
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
docker-compose -f docker/docker-compose.yml ps postgres

# Verificar logs
docker-compose -f docker/docker-compose.yml logs postgres
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

