# Segurança de Dados - OpenSilício

Este documento explica como seus dados são protegidos no OpenSilício e as melhores práticas para garantir que você nunca perca informação importante.

## 🛡️ Como Seus Dados São Protegidos

### Docker Volumes - Persistência Automática

Seu banco de dados PostgreSQL usa um **Docker Named Volume** (`postgres_data`), que significa:

```yaml
volumes:
  - postgres_data:/var/lib/postgresql/data
```

#### ✅ O que isso garante:

1. **Dados fora do container**: Os dados ficam em um volume separado, não dentro do container
2. **Sobrevive a rebuilds**: Quando você atualiza a aplicação (`docker-compose up --build`), os dados permanecem
3. **Sobrevive a restarts**: Reiniciar ou parar containers não afeta os dados
4. **Sobrevive a `docker-compose down`**: Mesmo parando todos os containers, os dados persistem

#### ⚠️ ÚNICA forma de perder dados:

```bash
# ⚠️ PERIGO! Isso deleta os volumes
docker-compose down -v  # Flag -v deleta volumes

# ⚠️ PERIGO! Isso também deleta volumes
docker volume rm opensilicio_postgres_data
```

**NUNCA use a flag `-v` em produção a menos que queira apagar tudo!**

## 📦 Localização dos Dados

### Onde o Docker armazena os volumes?

**Windows:**
```
C:\ProgramData\Docker\volumes\opensilicio_postgres_data\_data
```

**Linux:**
```
/var/lib/docker/volumes/opensilicio_postgres_data/_data
```

**Mac:**
```
~/Library/Containers/com.docker.docker/Data/vms/0/data/docker/volumes/opensilicio_postgres_data/_data
```

## 🔄 Processo Seguro de Atualização

### Nosso Script Automático

Quando você executa `update-prod.bat` ou `update-prod.sh`, o script:

1. ✅ **Cria backup automático** antes de qualquer mudança
2. ✅ Para os containers (dados permanecem no volume)
3. ✅ Reconstrói as imagens
4. ✅ Reinicia os containers
5. ✅ Executa migrações do banco de dados
6. ✅ Os dados são automaticamente remontados

### O que acontece internamente:

```
ANTES DO UPDATE:
┌─────────────┐     ┌──────────────┐
│  Container  │────▶│ Volume (10GB)│
│ PostgreSQL  │     │  Seus Dados  │
└─────────────┘     └──────────────┘

DURANTE UPDATE (Container parado):
┌─────────────┐     ┌──────────────┐
│  Container  │     │ Volume (10GB)│
│   (parado)  │  X  │  Seus Dados  │ ← Dados intactos!
└─────────────┘     └──────────────┘

DEPOIS DO UPDATE:
┌─────────────┐     ┌──────────────┐
│  Container  │────▶│ Volume (10GB)│
│ (atualizado)│     │  Seus Dados  │ ← Mesmos dados!
└─────────────┘     └──────────────┘
```

## 💾 Sistema de Backup

### Backup Automático (Durante Updates)

Sempre que você atualiza a produção:

```bash
scripts/production/update.bat  # Windows
# ou
./scripts/production/update.sh  # Linux/Mac
```

O script **automaticamente**:
1. Cria backup em `backups/backup_YYYYMMDD_HHMMSS.sql`
2. Se o backup falhar, **aborta** a atualização
3. Continua apenas se o backup for bem-sucedido

### Backup Manual

Para criar um backup a qualquer momento:

```bash
# Windows
scripts\production\backup.bat

# Linux/Mac
chmod +x scripts/production/backup.sh
./scripts/production/backup.sh
```

Backups são salvos em:
```
backups/
├── backup_20250121_140530.sql
├── backup_20250122_093015.sql
└── backup_20250123_151045.sql
```

### Restaurar um Backup

Se algo der errado, você pode restaurar:

```bash
# Windows
scripts\production\restore.bat backups\backup_20250121_140530.sql

# Linux/Mac
chmod +x scripts/production/restore.sh
./scripts/production/restore.sh backups/backup_20250121_140530.sql
```

**AVISO**: Isso **substitui** todos os dados atuais!

## 🔄 Backup Automático Agendado

### Configurar Backup Diário (Linux)

1. Criar script de backup automatizado:

```bash
#!/bin/bash
# /home/usuario/auto-backup.sh

cd /caminho/para/opensilicio
mkdir -p backups

# Criar backup
BACKUP_FILE="backups/auto_backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose -f docker/docker-compose.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > $BACKUP_FILE

# Manter apenas últimos 7 dias
find backups/ -name "auto_backup_*.sql" -mtime +7 -delete

# Log
echo "$(date): Backup criado - $BACKUP_FILE" >> backup.log
```

2. Tornar executável:
```bash
chmod +x /home/usuario/auto-backup.sh
```

3. Agendar no cron (diariamente às 2h da manhã):
```bash
crontab -e
```

Adicione:
```
0 2 * * * /home/usuario/auto-backup.sh
```

### Backup Automático (Windows)

Use o Agendador de Tarefas do Windows:

1. Abra "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Nome: "Backup OpenSilício"
4. Gatilho: Diariamente às 2:00
5. Ação: Iniciar programa
   - Programa: `C:\caminho\para\site_react\scripts\shell\backup-db.bat`

## 📊 Verificar Integridade dos Dados

### Verificar tamanho do volume:

```bash
docker volume inspect opensilicio_postgres_data
```

### Verificar espaço usado:

```bash
docker system df -v
```

### Conectar ao banco e verificar:

```bash
# Conectar ao PostgreSQL
docker-compose -f docker/docker-compose.yml exec postgres psql -U opensilicio opensilicio_prod

# Dentro do PostgreSQL
\dt                    -- Listar tabelas
SELECT COUNT(*) FROM blog_posts;
SELECT COUNT(*) FROM wiki_entries;
\q                     -- Sair
```

## 🔐 Backup Seguro na Nuvem

### Sincronizar Backups com Cloud Storage

#### Google Drive (Linux com rclone)

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Configurar Google Drive
rclone config

# Sincronizar backups
rclone sync backups/ gdrive:OpenSilicio-Backups/
```

#### Adicionar ao script de backup automático:

```bash
#!/bin/bash
# Depois de criar o backup local...

# Enviar para nuvem
rclone copy $BACKUP_FILE gdrive:OpenSilicio-Backups/
```

## 🚨 Recuperação de Desastre

### Cenário: Servidor foi completamente perdido

1. **Configure novo servidor**
2. **Instale Docker**
3. **Clone o repositório**
4. **Baixe o backup mais recente da nuvem**
5. **Inicie a aplicação**:
   ```bash
   docker-compose -f docker/docker-compose.yml up -d
   ```
6. **Restaure o backup**:
   ```bash
   ./scripts/production/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql
   ```
7. **Aplicação restaurada!** ✅

## 📋 Checklist de Segurança de Dados

- [ ] ✅ Volumes do Docker configurados (já está!)
- [ ] Backup automático diário configurado
- [ ] Backups são testados regularmente (faça um restore de teste!)
- [ ] Backups são armazenados fora do servidor (nuvem)
- [ ] Monitoramento de espaço em disco
- [ ] Documentação de recuperação está atualizada
- [ ] Equipe sabe como restaurar um backup
- [ ] Backups mantidos por pelo menos 30 dias

## 🎯 Melhores Práticas

### Regra 3-2-1 de Backup

1. **3 cópias** dos dados
   - Original (no volume Docker)
   - Backup local (pasta `backups/`)
   - Backup na nuvem (Google Drive/Dropbox/etc)

2. **2 tipos diferentes** de mídia
   - SSD do servidor
   - Cloud storage

3. **1 cópia offsite** (fora do servidor)
   - Google Drive, AWS S3, etc.

### Frequência Recomendada

- **Produção ativa**: Backup automático **diário**
- **Antes de updates**: Backup **sempre** (já incluído no script)
- **Antes de migrações**: Backup **manual** adicional
- **Teste de restore**: **Mensal**

## ❓ FAQ

**P: Perco dados ao fazer `docker-compose down`?**  
R: Não! Os dados estão no volume, não no container.

**P: Perco dados ao fazer rebuild?**  
R: Não! `docker-compose up --build` reconstrói a imagem, não o volume.

**P: E se deletar o container?**  
R: Os dados permanecem no volume. Ao recriar o container, ele monta o mesmo volume.

**P: Como faço backup do volume inteiro?**  
R: Use os scripts fornecidos (`backup-db.bat/sh`) que fazem pg_dump do banco.

**P: Posso migrar dados para outro servidor?**  
R: Sim! Crie um backup, copie para o novo servidor, e restaure.

**P: Quanto espaço os backups ocupam?**  
R: Depende dos dados. Um banco pequeno ~5MB, médio ~50MB, grande 500MB+.

**P: Os backups incluem uploads (imagens)?**  
R: Não. Os backups são do banco de dados. Copie `backend/uploads/` separadamente.

## 📞 Em Caso de Emergência

Se você perdeu dados e precisa ajuda:

1. **NÃO PANIQUE!**
2. **NÃO execute nenhum comando que delete volumes**
3. Verifique se tem backups em `backups/`
4. Verifique backups na nuvem
5. Tente restaurar o backup mais recente
6. Se ainda assim precisar de ajuda, consulte a equipe

---

**Seus dados estão seguros!** 🛡️

Com Docker volumes + backups automáticos + cloud storage, você tem proteção em múltiplas camadas.

