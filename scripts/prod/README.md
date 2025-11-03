# Scripts de Produção

Scripts para deploy e gerenciamento do ambiente de produção.

## 🚀 Scripts Disponíveis

### `deploy.bat` / `deploy.sh`
**Deploy inicial da aplicação em produção**

```bash
# Windows
.\scripts\prod\deploy.bat

# Linux/Mac
./scripts/prod/deploy.sh
```

**O que faz:**
1. ✅ Valida variáveis de ambiente (.env)
2. ✅ Constrói imagens Docker otimizadas
3. ✅ Inicia containers em produção
4. ✅ Executa migrações do banco
5. ✅ Cria usuário administrador
6. ✅ Configura settings iniciais

**Use quando:** Primeira vez fazendo deploy em um servidor novo.

---

### `update.bat` / `update.sh`
**Atualiza a aplicação em produção**

```bash
# Windows
.\scripts\prod\update.bat

# Linux/Mac
./scripts/prod/update.sh
```

**O que faz:**
1. 🔄 Atualiza código do repositório (git pull)
2. 💾 Cria backup automático do banco
3. 🏗️ Reconstrói imagens Docker
4. ♻️ Reinicia containers
5. 📊 Executa migrações pendentes

**Use quando:** Atualizar para uma versão mais recente.

---

### `backup.bat` / `backup.sh`
**Cria backup do banco de dados**

```bash
# Windows
.\scripts\prod\backup.bat

# Linux/Mac
./scripts/prod/backup.sh
```

**O que faz:**
- 💾 Cria backup completo do PostgreSQL
- 📁 Salva em `backups/backup_YYYYMMDD_HHMMSS.sql`
- ✅ Verifica integridade do backup

**Use quando:** Antes de mudanças importantes ou regularmente.

---

### `restore.bat` / `restore.sh`
**Restaura backup do banco de dados**

```bash
# Windows
.\scripts\prod\restore.bat backups\backup_file.sql

# Linux/Mac
./scripts/prod/restore.sh backups/backup_file.sql
```

**O que faz:**
- ⚠️ Para a aplicação
- 🗑️ Limpa banco atual
- 📥 Restaura dados do backup
- ♻️ Reinicia aplicação

**Use quando:** Precisar reverter para um estado anterior.

---

### `quick-start.bat` / `quick-start.sh`
**Deploy simplificado para primeira vez**

```bash
# Windows
.\scripts\prod\quick-start.bat

# Linux/Mac
./scripts/prod/quick-start.sh
```

**O que faz:**
- Valida .env
- Executa deploy completo
- Interface simplificada

**Use quando:** Primeira vez e quer algo mais guiado.

---

### `test.bat` / `test.sh`
**Testa ambiente de produção localmente**

```bash
# Windows
.\scripts\prod\test.bat

# Linux/Mac
./scripts/prod/test.sh
```

**O que faz:**
1. 🏗️ Constrói imagens de produção
2. 🚀 Inicia ambiente de teste
3. 📊 Executa migrações
4. 🧪 Cria dados de teste
5. ✅ Roda testes de integração
6. 🔍 Verifica integridade dos dados

**Use quando:** Testar mudanças antes de fazer deploy real.

---

### `validate-env.bat` / `validate-env.sh`
**Valida arquivo .env**

```bash
# Windows
.\scripts\prod\validate-env.bat

# Linux/Mac
./scripts/prod/validate-env.sh
```

**O que faz:**
- ✅ Verifica variáveis obrigatórias
- ⚠️ Alerta sobre problemas
- 📝 Sugere correções

**Use quando:** Antes de deploy ou após editar .env.

---

## 📋 Fluxos de Uso

### 1️⃣ Primeiro Deploy
```bash
# 1. Configure o .env
cp .env.example .env
# Edite o .env com valores de produção!

# 2. Valide configuração
.\scripts\prod\validate-env.bat

# 3. Deploy!
.\scripts\prod\deploy.bat
```

### 2️⃣ Atualizar Aplicação
```bash
# 1. Backup (opcional mas recomendado)
.\scripts\prod\backup.bat

# 2. Atualizar
.\scripts\prod\update.bat
```

### 3️⃣ Testar Localmente
```bash
# Testar build de produção antes de deploy
.\scripts\prod\test.bat
```

### 4️⃣ Recuperar de Problema
```bash
# Restaurar backup anterior
.\scripts\prod\restore.bat backups\backup_20250103_120000.sql
```

---

## 🔐 Segurança

### Antes de Produção:
- [ ] Configure `POSTGRES_PASSWORD` forte
- [ ] Gere `JWT_SECRET` aleatório (32+ chars)
- [ ] Configure `VITE_API_URL` com URL real
- [ ] Configure `CORS_ORIGINS` corretamente
- [ ] Verifique que `.env` não está no Git

### Backups Regulares:
```bash
# Crie cron job / scheduled task
# Linux: crontab -e
0 2 * * * /caminho/para/scripts/prod/backup.sh

# Windows: Task Scheduler
# Execute backup.bat diariamente às 2AM
```

---

## 🐛 Troubleshooting

### Deploy falha:
```bash
# 1. Valide .env
.\scripts\prod\validate-env.bat

# 2. Verifique logs
docker-compose -f docker\docker-compose.prod.yml logs

# 3. Reconstrua do zero
docker-compose -f docker\docker-compose.prod.yml down -v
.\scripts\prod\deploy.bat
```

### Aplicação não responde:
```bash
# Ver logs
docker-compose -f docker\docker-compose.prod.yml logs -f

# Reiniciar serviço específico
docker-compose -f docker\docker-compose.prod.yml restart backend
```

### Banco de dados corrompido:
```bash
# Restaurar último backup bom
.\scripts\prod\restore.bat backups\ultimo_backup_bom.sql
```

---

## 📊 Monitoramento

### Ver status:
```bash
docker-compose -f docker\docker-compose.prod.yml ps
```

### Ver logs em tempo real:
```bash
docker-compose -f docker\docker-compose.prod.yml logs -f
```

### Verificar saúde:
```bash
curl http://localhost:3001/health
```

---

## 🔧 Configuração Avançada

### Nginx/SSL:
Após deploy, configure:
- Nginx reverse proxy
- Certificado SSL (Let's Encrypt)
- Domínio personalizado

### Backup Automático:
Configure cron/scheduled task para backups regulares.

### Monitoring:
Integre com ferramentas de monitoramento:
- Logs: Papertrail, Loggly
- Uptime: UptimeRobot, Pingdom
- Errors: Sentry, Rollbar

