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

### `start-with-tests.bat` / `start-with-tests.sh`
**Inicia o ambiente de desenvolvimento E roda os testes**

```bash
# Windows
.\scripts\dev\start-with-tests.bat

# Linux/Mac
./scripts/dev/start-with-tests.sh
```

**O que faz:**
1. ✅ Executa tudo que o `start.bat` faz
2. ⏳ Aguarda ambiente estabilizar
3. 🧪 Roda testes de integração automaticamente
4. 📊 Mostra relatório dos testes

**Use quando:** 
- Quer verificar se tudo está funcionando após mudanças
- Desenvolvimento TDD (Test-Driven Development)
- Antes de fazer commit/push de código

---

### `clear-cache.bat` / `clear-cache.sh`
**Limpa cache e força rebuild completo**

```bash
# Windows
.\scripts\dev\clear-cache.bat

# Linux/Mac
./scripts/dev/clear-cache.sh
```

**O que faz:**
1. ⏹️ Para todos os containers
2. 🗑️ Remove volumes (node_modules, Vite cache)
3. 🧹 Limpa cache do Docker Builder
4. 🔄 Remove imagens antigas

**Use quando:**
- Erros de resolução de módulos (ex: Lexical, Vite)
- Após atualizar dependências no package.json
- "Failed to resolve entry" ou similar
- Comportamento estranho de cache

**Nota:** Após rodar, execute `.\scripts\dev\start.bat` para rebuildar tudo do zero.

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

### 4. Desenvolvimento com testes:
```bash
# Iniciar e rodar testes automaticamente
.\scripts\dev\start-with-tests.bat

# Ou rodar testes manualmente depois
docker-compose -f docker/docker-compose.dev.yml exec backend npm test
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

### Rodar testes:
```bash
# Todos os testes
docker-compose -f docker/docker-compose.dev.yml exec backend npm test

# Apenas testes de integração
docker-compose -f docker/docker-compose.dev.yml exec backend npm run test:integration

# Com watch mode (re-roda ao salvar)
docker-compose -f docker/docker-compose.dev.yml exec backend npm run test:watch

# Com coverage
docker-compose -f docker/docker-compose.dev.yml exec backend npm run test:coverage
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
.\scripts\dev\clear-cache.bat
.\scripts\dev\start.bat
```

### Erros de módulo/dependência (Lexical, Vite, etc):
```bash
# Limpar cache e rebuildar
.\scripts\dev\clear-cache.bat
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

