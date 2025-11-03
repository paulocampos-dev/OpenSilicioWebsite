# Scripts de Desenvolvimento

Scripts para gerenciar o ambiente de desenvolvimento local com Docker.

## 🚀 Scripts Disponíveis

### `start.bat` / `start.sh`
**Inicia o ambiente de desenvolvimento completo**

```bash
# Windows
.\scripts\dev\start.bat

# Linux/Mac
./scripts/dev/start.sh
```

**O que faz:**
- ✅ Inicia containers Docker (PostgreSQL, Backend, Frontend)
- ✅ Configura hot-reload para desenvolvimento
- ✅ Expõe portas para acesso local
- ✅ Configura volumes para desenvolvimento

**Serviços iniciados:**
- Frontend: http://localhost:5173 (Vite com HMR)
- Backend: http://localhost:3001 (com auto-reload)
- Database: localhost:5432

---

### `stop.bat` / `stop.sh`
**Para todos os containers de desenvolvimento**

```bash
# Windows
.\scripts\dev\stop.bat

# Linux/Mac
./scripts/dev/stop.sh
```

**O que faz:**
- ⏹️ Para todos os containers
- 🗑️ Remove containers (mantém volumes e dados)
- 🔄 Prepara para próximo start limpo

---

## 📋 Fluxo de Trabalho Típico

### 1. Primeira vez:
```bash
# 1. Configure o .env na raiz (se ainda não tem)
cp .env.example .env

# 2. Inicie o ambiente
.\scripts\dev\start.bat

# 3. Aguarde os serviços iniciarem (30-60s)
# 4. Acesse http://localhost:5173
```

### 2. Desenvolvimento diário:
```bash
# Iniciar
.\scripts\dev\start.bat

# ... desenvolver ...

# Parar ao final do dia
.\scripts\dev\stop.bat
```

### 3. Reiniciar após mudanças:
```bash
# Parar
.\scripts\dev\stop.bat

# Iniciar novamente
.\scripts\dev\start.bat
```

---

## 🔧 Comandos Úteis

### Ver logs:
```bash
docker-compose -f docker/docker-compose.dev.yml logs -f
```

### Acessar banco de dados:
```bash
docker-compose -f docker/docker-compose.dev.yml exec postgres psql -U admin -d opensilicio
```

### Executar migrações manualmente:
```bash
docker-compose -f docker/docker-compose.dev.yml exec backend npm run migrate
```

### Reiniciar apenas um serviço:
```bash
docker-compose -f docker/docker-compose.dev.yml restart backend
docker-compose -f docker/docker-compose.dev.yml restart frontend
```

---

## 🐛 Troubleshooting

### Porta já em uso:
```bash
# Verificar o que está usando a porta
netstat -ano | findstr :5173
netstat -ano | findstr :3001

# Parar processo ou mudar porta no .env
```

### Containers não iniciam:
```bash
# Limpar tudo e começar do zero
docker-compose -f docker/docker-compose.dev.yml down -v
.\scripts\dev\start.bat
```

### Hot-reload não funciona:
```bash
# Reiniciar o serviço específico
docker-compose -f docker/docker-compose.dev.yml restart frontend
docker-compose -f docker/docker-compose.dev.yml restart backend
```

---

## ⚙️ Configuração

O ambiente de desenvolvimento usa:
- **docker-compose.dev.yml** - Configuração dos containers
- **.env** (raiz) - Variáveis de ambiente
- Volumes montados para hot-reload
- Portas expostas para acesso direto

**Não precisa instalar Node.js localmente!** Tudo roda no Docker.

