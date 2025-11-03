# Guia de Deploy em Produção - OpenSilício

Este guia completo descreve como fazer o deploy da aplicação OpenSilício em produção.

## 📋 Pré-requisitos

- Servidor Linux (Ubuntu 20.04+ recomendado) ou Windows Server
- Docker e Docker Compose instalados
- Acesso SSH ao servidor
- Domínio configurado (opcional, mas recomendado)
- 2GB+ de RAM
- 10GB+ de espaço em disco

## 🚀 Deploy Inicial

### 1. Preparar o Servidor

```bash
# Atualizar sistema (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

### 2. Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/opensilicio.git
cd opensilicio
```

### 3. Configurar Variáveis de Ambiente

#### Opção 1: Quick Start (Recomendado para primeira vez)

```bash
# Windows
scripts\production\quick-start.bat

# Linux/Mac
chmod +x scripts/production/quick-start.sh
./scripts/production/quick-start.sh
```

O script cria automaticamente um arquivo `.env` baseado em `.env.example` e guia você através da configuração.

#### Opção 2: Manual

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
nano .env
```

Configure as variáveis:

```env
# Database
POSTGRES_DB=opensilicio_prod
POSTGRES_USER=opensilicio
POSTGRES_PASSWORD=SuaSenhaSegura123!

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=SeuJWTSecretMuitoSeguro123!
# DATABASE_URL será construído automaticamente pelo docker-compose.prod.yml

# Frontend (build time)
VITE_API_URL=https://seu-dominio.com/api
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

**IMPORTANTE**: 
- Gere senhas fortes para produção!
- `DATABASE_URL` é construído automaticamente - não precisa configurá-lo manualmente
- `JWT_SECRET` deve ter pelo menos 32 caracteres

```bash
# Gerar senha aleatória segura
openssl rand -base64 32
```

### 4. Executar Deploy

```bash
# Dar permissão de execução ao script
chmod +x scripts/production/deploy.sh

# Executar deploy
./scripts/production/deploy.sh
```

Ou no Windows:

```bash
scripts\production\deploy.bat
```

O script:
1. Valida variáveis de ambiente obrigatórias
2. Para containers existentes
3. Constrói imagens de produção otimizadas
4. Inicia containers usando `docker-compose.prod.yml`
5. Executa migrações automaticamente
6. Oferece criar usuário admin e configurações iniciais

**Nota:** O deploy usa `docker-compose.prod.yml` que serve o frontend via Nginx em vez do servidor de desenvolvimento Vite.

## 🌐 Configurar Nginx como Reverse Proxy

**Nota:** Com o novo setup de produção, o frontend já é servido via Nginx dentro do container Docker. Você ainda pode configurar um Nginx externo como proxy reverso adicional se necessário.

### Opção 1: Usar Nginx do Container (Recomendado)

O frontend já está sendo servido via Nginx na porta 80 do container. Basta mapear para a porta desejada no host ou configurar um proxy reverso externo apontando para `localhost:80`.

### Opção 2: Nginx Externo como Proxy Reverso

Se você quiser um Nginx externo adicional:

#### Instalar Nginx

```bash
sudo apt install nginx -y
```

#### Configurar Site

Crie `/etc/nginx/sites-available/opensilicio`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Tamanho máximo de upload
    client_max_body_size 10M;

    # Frontend (proxying para container nginx na porta 80)
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Uploads estáticos (proxied via backend)
    location /uploads {
        proxy_pass http://localhost:3001;
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

### Ativar Site

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/opensilicio /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

## 🔒 Configurar HTTPS com Let's Encrypt

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Testar renovação automática
sudo certbot renew --dry-run
```

## 📦 Backup do Banco de Dados

### Criar Backup Manual

```bash
# Windows
scripts\production\backup.bat

# Linux/Mac
scripts/production/backup.sh
```

Ou manualmente:

```bash
# Criar diretório de backups
mkdir -p backups

# Fazer backup (ajuste USER e DB conforme seu .env)
docker-compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### Configurar Backup Automático

Crie um script de backup `/home/usuario/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/usuario/backups"
mkdir -p $BACKUP_DIR
cd /home/usuario/opensilicio

# Criar backup
docker-compose -f docker/docker-compose.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql

# Manter apenas os últimos 7 dias
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup concluído em $(date)"
```

Tornar executável e agendar com cron:

```bash
chmod +x ~/backup-db.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
crontab -e
```

Adicione a linha:

```
0 2 * * * /home/usuario/backup-db.sh >> /home/usuario/backup.log 2>&1
```

### Restaurar Backup

```bash
# Windows
scripts\production\restore.bat backups\backup_YYYYMMDD_HHMMSS.sql

# Linux/Mac
scripts/production/restore.sh backups/backup_YYYYMMDD_HHMMSS.sql
```

O script solicita confirmação antes de restaurar, pois isso substitui todos os dados atuais.

## 🔄 Atualizar Aplicação

### Usando Script (Recomendado)

```bash
# Windows
scripts\production\update.bat

# Linux/Mac
chmod +x scripts/production/update.sh
./scripts/production/update.sh
```

O script:
1. **Cria backup automático** do banco de dados antes de qualquer mudança
2. Atualiza código do repositório
3. Para containers
4. Reconstrói imagens de produção
5. Reinicia containers
6. Executa migrações automaticamente

### Manualmente

```bash
# 1. Criar backup manual primeiro!
scripts/production/backup.sh

# 2. Pull das últimas mudanças
git pull origin main

# 3. Rebuild e restart usando docker-compose.prod.yml
docker-compose -f docker/docker-compose.prod.yml up -d --build

# 4. Executar migrações (se houver)
docker-compose -f docker/docker-compose.prod.yml exec backend npm run migrate

# 5. Verificar logs
docker-compose -f docker/docker-compose.prod.yml logs -f
```

## 📊 Monitoramento

### Ver Logs

```bash
# Todos os serviços
docker-compose -f docker/docker-compose.prod.yml logs -f

# Apenas backend
docker-compose -f docker/docker-compose.prod.yml logs -f backend

# Apenas frontend
docker-compose -f docker/docker-compose.prod.yml logs -f frontend

# Últimas 100 linhas
docker-compose -f docker/docker-compose.prod.yml logs --tail=100
```

### Verificar Status

```bash
# Status dos containers
docker-compose -f docker/docker-compose.prod.yml ps

# Uso de recursos
docker stats

# Espaço em disco
docker system df
```

### Monitoramento Avançado (Opcional)

Instalar Portainer para gerenciamento visual:

```bash
docker volume create portainer_data
docker run -d -p 9000:9000 --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

Acesse: `http://seu-dominio.com:9000`

## 🔧 Manutenção

### Limpar Docker

```bash
# Remover containers parados
docker container prune -f

# Remover imagens não utilizadas
docker image prune -a -f

# Limpar tudo (cuidado!)
docker system prune -a -f --volumes
```

### Reiniciar Serviços

```bash
# Reiniciar tudo
docker-compose -f docker/docker-compose.prod.yml restart

# Reiniciar apenas backend
docker-compose -f docker/docker-compose.prod.yml restart backend

# Reiniciar apenas frontend
docker-compose -f docker/docker-compose.prod.yml restart frontend
```

## 🚨 Troubleshooting

### Containers não iniciam

```bash
# Ver logs detalhados
docker-compose -f docker/docker-compose.prod.yml logs

# Verificar se as portas estão em uso
sudo netstat -tulpn | grep -E '(80|3001|5432)'

# Validar variáveis de ambiente
scripts/production/validate-env.sh  # Linux/Mac
scripts\production\validate-env.bat  # Windows

# Recriar containers do zero (CUIDADO: isso deleta volumes se usar -v)
docker-compose -f docker/docker-compose.prod.yml down
docker-compose -f docker/docker-compose.prod.yml up -d --build
```

### Banco de dados não conecta

```bash
# Verificar se PostgreSQL está rodando
docker-compose -f docker/docker-compose.prod.yml ps postgres

# Conectar ao banco manualmente
docker-compose -f docker/docker-compose.prod.yml exec postgres psql -U opensilicio opensilicio_prod

# Verificar logs do PostgreSQL
docker-compose -f docker/docker-compose.prod.yml logs postgres

# Verificar se DATABASE_URL está correto (deve ser construído automaticamente)
# O formato correto é: postgresql://USER:PASSWORD@postgres:5432/DB
```

### Aplicação lenta

```bash
# Verificar uso de CPU e memória
docker stats

# Aumentar recursos no docker-compose.yml
# Adicionar limits e reservations conforme necessário
```

## 🔐 Segurança

### Checklist de Segurança

- [ ] Senhas fortes configuradas no `.env`
- [ ] JWT_SECRET único e complexo (mínimo 32 caracteres)
- [ ] Variáveis de ambiente validadas (use `scripts/production/validate-env.sh`)
- [ ] HTTPS configurado com Let's Encrypt
- [ ] Firewall configurado (apenas portas 80, 443, 22 abertas)
- [ ] Backups automáticos configurados
- [ ] Logs sendo monitorados
- [ ] Docker atualizado para última versão
- [ ] Sistema operacional atualizado
- [ ] Arquivos .env com permissões restritas (chmod 600)
- [ ] Testes executados antes do deploy (`npm test` no backend)

### Configurar Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

## 📈 Performance

### Otimizações Já Implementadas

1. ✅ **Nginx servindo frontend** - Frontend estático servido via Nginx
2. ✅ **Gzip compression** - Ativado no Nginx do container
3. ✅ **Cache headers** - Assets estáticos com cache apropriado
4. ✅ **Build otimizado** - Frontend compilado com Vite em modo produção
5. ✅ **Code splitting** - Frontend com chunks otimizados

### Otimizações Adicionais Recomendadas

1. **Database Indexing**: Garanta que índices estão criados
2. **CDN**: Use CloudFlare ou similar para assets
3. **HTTP/2**: Ative HTTP/2 no Nginx externo (se usar)
4. **Monitoring**: Configure monitoramento de performance

### Exemplo de Nginx com Cache

O Nginx do container já está configurado com cache. Se usar Nginx externo:

```nginx
# Cache de assets
location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 📞 Suporte

Para problemas ou dúvidas:
- Consulte a documentação completa em [README/README.md](README.md)
- Verifique as issues abertas no GitHub
- Entre em contato com a equipe OpenSilício

---

**OpenSilício** - Deploy Seguro e Eficiente 🚀

