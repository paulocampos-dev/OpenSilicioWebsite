# Guia de Desenvolvimento e Teste de Produção

## 🚀 Modo Desenvolvimento (Recomendado)

### Opção 1: Docker com Hot Reload (Mais Fácil e Recomendado)

**Windows:**

```bash
scripts\development\start.bat
```

**Linux/Mac:**

```bash
chmod +x scripts/development/start.sh
./scripts/development/start.sh
```

**Vantagens:**

- ✅ Hot reload automático (backend ~2s, frontend instantâneo)
- ✅ Ambiente isolado e consistente
- ✅ Não precisa instalar Node.js localmente
- ✅ Fácil de limpar e reiniciar
- ✅ Simula ambiente de produção mais próximo

**Como funciona:**

- Backend usa `ts-node-dev` com watch mode
- Frontend usa Vite HMR (Hot Module Replacement)
- Código fonte montado via volumes Docker
- Mudanças no código são detectadas automaticamente

**Acesse:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Admin: `AdmOpen` / senha configurada no `ADMIN_PASSWORD` (padrão: `Dev123!@LocalOnly`)

**Para parar:**

```bash
scripts\dev\stop.bat  # Windows
scripts/dev/stop.sh   # Linux/Mac
```

**Para iniciar com testes automáticos:**

```bash
scripts\dev\start-with-tests.bat  # Windows
scripts/dev/start-with-tests.sh   # Linux/Mac
```

Isso iniciará o ambiente e rodará os testes de integração automaticamente.

### Opção 2: Desenvolvimento Local (Sem Docker)

**Quando usar:**

- Quer debugar mais facilmente
- Prefere usar ferramentas locais (debugger, IDE)
- Não tem Docker disponível

**Windows:**

```bash
scripts\development\local.bat
```

**Linux/Mac:**

```bash
chmod +x scripts/development/local.sh
./scripts/development/local.sh
```

**Requisitos:**

- Node.js 18+ instalado
- PostgreSQL rodando no Docker (apenas o banco)

**Vantagens:**

- ✅ Debugging mais direto
- ✅ Logs em arquivos (`logs/backend.log`)
- ✅ Acesso direto ao código
- ✅ Performance um pouco melhor

**Desvantagens:**

- ❌ Precisa ter Node.js instalado
- ❌ Precisa configurar variáveis de ambiente manualmente
- ❌ Pode ter diferenças entre desenvolvedores

---

## 🧪 Testar Produção Localmente

### Método 1: Teste Completo de Produção (Recomendado)

Este método testa o setup completo de produção usando o mesmo `docker-compose.prod.yml` que será usado em produção real.

#### 1. Criar arquivo `.env` para teste de produção

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
POSTGRES_DB=opensilicio_prod
POSTGRES_USER=opensilicio
POSTGRES_PASSWORD=TestProdPassword123!

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=test-jwt-secret-for-local-production-testing-32-chars-min

# Frontend
VITE_API_URL=http://localhost:3001/api
CORS_ORIGINS=http://localhost:80,http://localhost:3001
```

#### 2. Parar ambiente de desenvolvimento

```bash
scripts\development\stop.bat  # Windows
scripts/development/stop.sh   # Linux/Mac
```

#### 3. Executar deploy de produção localmente

```bash
# Windows
scripts\production\deploy.bat

# Linux/Mac
chmod +x scripts/production/deploy.sh
./scripts/production/deploy.sh
```

Ou manualmente:

```bash
# Build e iniciar containers de produção
docker-compose -f docker/docker-compose.prod.yml up --build -d

# Aguardar containers iniciarem
timeout /t 15 /nobreak  # Windows
sleep 15                 # Linux/Mac

# Executar migrações
docker-compose -f docker/docker-compose.prod.yml exec backend npm run migrate

# Criar usuário admin
docker-compose -f docker/docker-compose.prod.yml exec backend npm run seed:admin
```

#### 4. Testar a aplicação

- **Frontend (via Nginx):** http://localhost:80
- **Backend API:** http://localhost:3001
- **Admin:** `AdmOpen` / senha do `.env` (`ADMIN_PASSWORD`)

**O que verificar:**

- ✅ Frontend carrega corretamente
- ✅ API responde em `/api/...`
- ✅ Login funciona
- ✅ Uploads funcionam
- ✅ Todas as rotas principais funcionam
- ✅ Nginx está servindo arquivos estáticos
- ✅ Performance está boa

#### 5. Ver logs

```bash
# Ver todos os logs
docker-compose -f docker/docker-compose.prod.yml logs -f

# Ver apenas backend
docker-compose -f docker/docker-compose.prod.yml logs -f backend

# Ver apenas frontend (nginx)
docker-compose -f docker/docker-compose.prod.yml logs -f frontend
```

#### 6. Parar ambiente de teste

```bash
docker-compose -f docker/docker-compose.prod.yml down
```

**Nota:** Isso mantém os volumes, então seus dados permanecem seguros.

### Método 2: Teste Rápido de Build

Teste apenas se o build de produção funciona sem rodar tudo:

```bash
# Testar build do backend
cd backend
npm run build
# Verificar se dist/ foi criado sem erros

# Testar build do frontend
cd ../openSilicioWebsite
npm run build
# Verificar se dist/ foi criado sem erros
```

### Método 3: Teste de Validação de Ambiente

Verifique se todas as variáveis de ambiente necessárias estão configuradas:

```bash
# Windows
scripts\production\validate-env.bat

# Linux/Mac
chmod +x scripts/production/validate-env.sh
./scripts/production/validate-env.sh
```

---

## 🔄 Fluxo Recomendado de Trabalho

### Desenvolvimento Diário

1. **Iniciar ambiente de desenvolvimento:**

   ```bash
   scripts\development\start.bat
   ```
2. **Desenvolver e testar:**

   - Edite código normalmente
   - Hot reload detecta mudanças automaticamente
   - Teste no navegador
3. **Executar testes:**

   ```bash
   cd backend
   npm test
   ```
4. **Ao final do dia:**

   ```bash
   scripts\development\stop.bat
   ```

### Antes de Fazer Deploy

1. **Testar produção localmente com script automatizado:**

   ```bash
   scripts\production\test-production.bat
   ```

   Isso testa tudo automaticamente: cria dados, executa testes, aplica migrações e verifica integridade.
2. **OU testar manualmente:**

   ```bash
   scripts\production\deploy.bat
   ```

   E então verificar manualmente:

   - Acesse http://localhost:80
   - Teste login
   - Teste funcionalidades principais
   - Verifique logs
3. **Executar testes:**

   ```bash
   cd backend
   npm test
   ```
4. **Validar ambiente:**

   ```bash
   scripts\production\validate-env.bat
   ```
5. **Se tudo estiver OK, fazer deploy real:**

   ```bash
   # No servidor de produção
   scripts\production\update.bat
   ```

### Limpar Tudo e Começar do Zero

```bash
# Parar tudo
scripts\development\stop.bat
docker-compose -f docker/docker-compose.prod.yml down

# Remover volumes (CUIDADO: apaga dados!)
docker-compose -f docker/docker-compose.dev.yml down -v
docker-compose -f docker/docker-compose.prod.yml down -v

# Limpar Docker
docker system prune -a
```

---

## 🐛 Troubleshooting

### Porta já em uso

```bash
# Windows
netstat -ano | findstr :5173
netstat -ano | findstr :3001
netstat -ano | findstr :80

# Linux/Mac
lsof -i :5173
lsof -i :3001
lsof -i :80
```

### Hot reload não funciona

1. Verifique se os volumes estão montados corretamente
2. Verifique permissões de arquivo
3. Tente reiniciar os containers:
   ```bash
   scripts\development\stop.bat
   scripts\development\start.bat
   ```

### Erro de conexão com banco

1. Verifique se PostgreSQL está rodando:

   ```bash
   docker-compose -f docker/docker-compose.dev.yml ps postgres
   ```
2. Verifique logs:

   ```bash
   docker-compose -f docker/docker-compose.dev.yml logs postgres
   ```
3. Recrie o banco se necessário:

   ```bash
   docker-compose -f docker/docker-compose.dev.yml down -v
   scripts\development\start.bat
   ```

---

## 📊 Comparação: Desenvolvimento vs Produção

| Aspecto                | Desenvolvimento          | Produção                         |
| ---------------------- | ------------------------ | ---------------------------------- |
| **Frontend**     | Vite dev server          | Nginx servindo arquivos estáticos |
| **Backend**      | ts-node-dev (hot reload) | Node.js compilado                  |
| **Build**        | Não compila             | Compila TypeScript → JavaScript   |
| **Source Maps**  | Sim                      | Não (ou limitados)                |
| **Logs**         | Detalhados               | Apenas essenciais                  |
| **Performance**  | Otimizado para dev       | Otimizado para produção          |
| **Cache**        | Sem cache                | Cache de assets                    |
| **Console Logs** | Todos                    | Apenas em desenvolvimento          |

---

## 💡 Dicas

1. **Use o modo Docker com hot reload** para desenvolvimento diário - é mais rápido e confiável
2. **Teste produção localmente** antes de fazer deploy real
3. **Execute testes** (`npm test`) antes de cada commit
4. **Mantenha `.env` no `.gitignore`** - nunca commite senhas
5. **Use `validate-env`** antes de fazer deploy
6. **Verifique logs** se algo não funcionar
7. **Faça backup** antes de atualizar produção

---

## ✅ Checklist Antes de Deploy

- [ ] Todos os testes passam (`npm test`)
- [ ] Build de produção funciona localmente
- [ ] Variáveis de ambiente validadas (`validate-env`)
- [ ] Aplicação funciona em modo produção local
- [ ] Sem erros nos logs
- [ ] Backup criado (se atualizando produção existente)
- [ ] Documentação atualizada
- [ ] `.env` configurado corretamente no servidor
