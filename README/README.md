# OpenSilício - Website Completo

Um website completo para o grupo universitário OpenSilício, com sistema de gerenciamento de conteúdo, blog, área educacional e wiki integrada.

## 🚀 Funcionalidades

- **Landing Page** - Página inicial com informações sobre o grupo
- **Blog** - Sistema de posts com categorias e busca
- **Educação** - Recursos educacionais organizados por categoria
- **Wiki** - Dicionário de termos técnicos com links automáticos
- **Painel Administrativo** - Interface completa para gerenciar conteúdo
- **Editor Rico** - Suporte a Lexical com upload de imagens
- **Autenticação** - Sistema de login seguro com JWT
- **Docker** - Ambiente de desenvolvimento containerizado
- **Testes de Integração** - Suite completa de testes automatizados
- **Deploy Simplificado** - Scripts automatizados para produção

## 🛠️ Tecnologias

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- JWT para autenticação
- Multer para upload de arquivos
- bcrypt para hash de senhas
- Jest + Supertest para testes

### Frontend
- React + TypeScript
- Material-UI (MUI)
- Lexical para editor rico
- Axios para requisições HTTP
- React Router para navegação
- Vite para build otimizado

### DevOps
- Docker + Docker Compose
- Scripts de desenvolvimento automatizados
- Scripts de produção com validação
- Nginx para servir frontend em produção
- Sistema de backup automatizado

## 📋 Pré-requisitos

- Docker Desktop instalado e rodando
- Git

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd site_react
```

### 2. Execute o script de desenvolvimento

#### Modo Local (Recomendado para Desenvolvimento)
Roda apenas o banco de dados no Docker, backend e frontend localmente com hot-reload.

**Pré-requisitos:** Node.js 18+ instalado

**No Windows:**
```bash
dev-local.bat
```

**No Linux/Mac:**
```bash
chmod +x dev-local.sh
./dev-local.sh
```

**Vantagens:**
- ✅ Hot-reload automático (backend e frontend)
- ✅ Desenvolvimento mais rápido
- ✅ Logs em arquivos separados (`logs/backend.log`)
- ✅ Reiniciar facilmente com `dev-local.bat restart`

**Para parar:**
```bash
# Windows
stop-dev.bat

# Linux/Mac
./stop-dev.sh
```

#### Modo Docker Completo (Ambiente Completo)
Roda tudo em containers Docker (útil para testar deploy).

**No Windows:**
```bash
dev-start.bat
```

**No Linux/Mac:**
```bash
chmod +x dev-start.sh
./dev-start.sh
```

**Vantagens:**
- ✅ Ambiente isolado e idêntico à produção
- ✅ Sem necessidade de Node.js instalado localmente

#### 🆕 Modo Docker Dev com Hot Reload (Novo!)
**Melhor dos dois mundos**: Tudo em containers Docker COM hot-reload automático!

```bash
docker-compose -f docker-compose.dev.yml up
```

**Vantagens:**
- 🚀 **Hot-reload em containers** (backend + frontend)
- 🔧 **Ambiente 100% isolado** (nada instalado no host)
- ⚡ **Performance otimizada** com volumes delegados
- 🎯 **Configuração otimizada** para desenvolvimento

**Recursos:**
- Backend: ts-node-dev com hot-reload (~2s)
- Frontend: Vite HMR instantâneo (<1s)
- Node_modules em volumes nomeados (zero conflitos)
- Watched files via sistema de arquivos nativo (sem polling)

> 📖 **Guia Detalhado**: Veja [DOCKER_DEV_GUIDE.md](DOCKER_DEV_GUIDE.md) para documentação completa sobre hot reloading em Docker.
> 
> 💡 **Comandos Rápidos**: Veja [.dockerdev-commands.md](.dockerdev-commands.md) para referência rápida.

### 3. Acesse a aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

> 📖 **Guia Completo**: Veja [DEV_SETUP.md](DEV_SETUP.md) para instruções detalhadas, troubleshooting e dicas de desenvolvimento.

## 👤 Credenciais de Acesso

**Usuário Administrador:**
- Username: `AdmOpen`
- Password: `ADMOpenSilicio123!@2025`

## 📁 Estrutura do Projeto

```
site_react/
├── backend/                 # API Node.js/Express
│   ├── src/
│   │   ├── config/          # Configuração do banco
│   │   ├── controllers/     # Controladores da API
│   │   ├── middleware/      # Middlewares (auth, etc)
│   │   ├── routes/          # Rotas da API
│   │   ├── scripts/         # Scripts de migração
│   │   └── server.ts        # Servidor principal
│   ├── uploads/             # Arquivos enviados
│   ├── init.sql             # Schema do banco
│   └── Dockerfile
├── openSilicioWebsite/       # Frontend React
│   ├── src/
│   │   ├── components/      # Componentes reutilizáveis
│   │   ├── contexts/        # Contextos React
│   │   ├── pages/           # Páginas da aplicação
│   │   │   ├── admin/        # Páginas administrativas
│   │   │   └── ...          # Páginas públicas
│   │   ├── services/        # Serviços de API
│   │   └── App.tsx          # Componente principal
│   └── Dockerfile
├── docker-compose.yml       # Orquestração dos containers
├── dev-start.sh            # Script de desenvolvimento (Linux/Mac)
├── dev-start.bat           # Script de desenvolvimento (Windows)
└── README.md
```

## 🔧 Comandos Úteis

### Desenvolvimento Local (Recomendado)
```bash
# Iniciar ambiente de desenvolvimento
./dev-local.sh  # ou dev-local.bat no Windows

# Reiniciar todos os serviços
./dev-local.sh restart  # ou dev-local.bat restart no Windows

# Parar todos os serviços
./stop-dev.sh  # ou stop-dev.bat no Windows

# Ver logs do backend
tail -f logs/backend.log  # ou type logs\backend.log no Windows

# Ver logs do frontend (Linux/Mac)
tail -f logs/frontend.log
```

### Desenvolvimento Docker (Ambiente Completo)
```bash
# Iniciar ambiente de desenvolvimento
./dev-start.sh  # ou dev-start.bat no Windows

# Ver logs dos containers
docker-compose logs -f

# Parar todos os containers
docker-compose down

# Reconstruir containers
docker-compose up --build
```

### Banco de Dados
```bash
# Acessar PostgreSQL
docker-compose exec postgres psql -U admin -d opensilicio

# Executar migração de dados
docker-compose exec backend npx ts-node src/scripts/migrateData.ts

# Criar usuário admin
docker-compose exec backend npx ts-node src/scripts/seedAdmin.ts
```

## 📝 Como Usar

### 1. Acessar o Painel Administrativo
1. Acesse http://localhost:5173
2. Clique em "Entrar" no menu superior
3. Faça login com as credenciais: `AdmOpen` / `ADMOpenSilicio123!@2025`
4. Você será redirecionado para o painel administrativo

### 2. Gerenciar Conteúdo

**Blog:**
- Criar novos posts
- Editar posts existentes
- Definir categorias e status de publicação
- Upload de imagens de capa

**Educação:**
- Criar recursos educacionais
- Organizar por categorias
- Conteúdo rico com editor WYSIWYG/Markdown

**Wiki:**
- Criar entradas de termos técnicos
- Definir definições curtas e conteúdo detalhado
- Links automáticos no conteúdo do blog/educação

### 3. Editor Rico
- Alternar entre modo WYSIWYG e Markdown
- Upload de imagens diretamente no editor
- Formatação completa (negrito, itálico, listas, etc.)
- Preview em tempo real

## 🔒 Segurança

- Autenticação JWT com expiração de 7 dias
- Hash de senhas com bcrypt
- Middleware de autenticação em rotas protegidas
- Validação de tipos de arquivo no upload
- Sanitização de entrada de dados

## 🌐 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verificar token

### Blog
- `GET /api/blog` - Listar posts
- `GET /api/blog/:slug` - Obter post por slug
- `POST /api/blog` - Criar post (admin)
- `PUT /api/blog/:id` - Atualizar post (admin)
- `DELETE /api/blog/:id` - Deletar post (admin)

### Educação
- `GET /api/education` - Listar recursos
- `GET /api/education/:id` - Obter recurso por ID
- `POST /api/education` - Criar recurso (admin)
- `PUT /api/education/:id` - Atualizar recurso (admin)
- `DELETE /api/education/:id` - Deletar recurso (admin)

### Wiki
- `GET /api/wiki` - Listar entradas
- `GET /api/wiki/:slug` - Obter entrada por slug
- `POST /api/wiki` - Criar entrada (admin)
- `PUT /api/wiki/:id` - Atualizar entrada (admin)
- `DELETE /api/wiki/:id` - Deletar entrada (admin)

### Upload
- `POST /api/upload` - Upload de arquivos (admin)

## 🐛 Solução de Problemas

### Container não inicia
```bash
# Verificar se Docker está rodando
docker info

# Limpar containers antigos
docker-compose down -v
docker system prune -f
```

### Erro de conexão com banco
```bash
# Verificar logs do PostgreSQL
docker-compose logs postgres

# Reiniciar apenas o banco
docker-compose restart postgres
```

### Problemas de permissão (Linux/Mac)
```bash
# Dar permissão de execução ao script
chmod +x dev-start.sh
```

## 🚀 Deploy em Produção

### Deploy Rápido (Recomendado)

Use o script de quick-start para deploy inicial simplificado:

```bash
# Windows
scripts\production\quick-start.bat

# Linux/Mac
chmod +x scripts/production/quick-start.sh
./scripts/production/quick-start.sh
```

O script:
1. Verifica se `.env` existe (cria de `.env.example` se necessário)
2. Valida variáveis de ambiente obrigatórias
3. Executa deploy completo

### Deploy Manual

#### 1. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as configurações de produção:

```env
# Database
POSTGRES_DB=opensilicio_prod
POSTGRES_USER=opensilicio
POSTGRES_PASSWORD=SUA_SENHA_FORTE_AQUI

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=SEU_JWT_SECRET_SEGURO_AQUI
# DATABASE_URL é construído automaticamente pelo docker-compose.prod.yml

# Frontend (build time)
VITE_API_URL=https://seu-dominio.com/api
CORS_ORIGINS=https://seu-dominio.com,https://www.seu-dominio.com
```

**Nota:** `DATABASE_URL` é construído automaticamente a partir das variáveis de PostgreSQL. Não é necessário configurá-lo manualmente.

#### 2. Build e Deploy

```bash
# Windows
scripts\production\deploy.bat

# Linux/Mac
chmod +x scripts/production/deploy.sh
./scripts/production/deploy.sh
```

O script usa `docker-compose.prod.yml` que:
- Constrói imagens otimizadas de produção
- Serve frontend via Nginx
- Executa migrações automaticamente
- Oferece criar usuário admin e configurações iniciais

#### 3. Atualizar Aplicação

```bash
# Windows
scripts\production\update.bat

# Linux/Mac
./scripts/production/update.sh
```

O script:
- Cria backup automático antes de atualizar
- Atualiza código do repositório
- Reconstrói imagens
- Executa migrações se necessário

### Configuração de Servidor

#### Nginx (Reverse Proxy)

Exemplo de configuração Nginx para produção:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 10M;
    }

    # Uploads
    location /uploads {
        alias /caminho/para/site_react/backend/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### Backup do Banco de Dados

```bash
# Criar backup
docker-compose -f docker/docker-compose.yml exec postgres pg_dump -U opensilicio opensilicio_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
docker-compose -f docker/docker-compose.yml exec -T postgres psql -U opensilicio opensilicio_prod < backup.sql
```

### Monitoramento

```bash
# Ver logs em tempo real
docker-compose -f docker/docker-compose.yml logs -f

# Ver uso de recursos
docker stats

# Verificar saúde dos containers
docker-compose -f docker/docker-compose.yml ps
```

### Atualização da Aplicação

```bash
# Pull das últimas mudanças
git pull origin main

# Rebuild e restart
docker-compose -f docker/docker-compose.yml up -d --build

# Executar migrações se necessário
docker-compose -f docker/docker-compose.yml exec backend npm run migrate
```

## 🧪 Testes

O projeto inclui uma suite completa de testes de integração que testam os endpoints da API da mesma forma que o frontend os usa.

### Executar Testes

```bash
cd backend
npm test                # Executar todos os testes
npm run test:watch      # Modo watch para desenvolvimento
npm run test:coverage   # Gerar relatório de cobertura
npm run test:integration # Apenas testes de integração
```

### Estrutura dos Testes

- `backend/src/tests/integration/auth.test.ts` - Testes de autenticação
- `backend/src/tests/integration/blog.test.ts` - Testes de blog
- `backend/src/tests/integration/education.test.ts` - Testes de educação
- `backend/src/tests/integration/wiki.test.ts` - Testes de wiki
- `backend/src/tests/integration/settings.test.ts` - Testes de configurações

Para mais detalhes, veja [backend/src/tests/README.md](../backend/src/tests/README.md)

## 📈 Status do Projeto

### ✅ Implementado

- [x] Sistema de backup automático
- [x] Deploy em produção com Docker otimizado
- [x] Wiki com links automáticos
- [x] Editor rico com Lexical
- [x] Sistema de pending wiki links
- [x] Scripts de produção automatizados
- [x] Validação de variáveis de ambiente
- [x] Frontend servido via Nginx em produção
- [x] Testes de integração completos
- [x] Console logs apenas em desenvolvimento

### 🔄 Próximos Passos

- [ ] Sistema de comentários no blog
- [ ] Notificações por email
- [ ] Sistema de tags
- [ ] Busca avançada
- [ ] Analytics de visualizações

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte, entre em contato através do email: [seu-email@exemplo.com]

---

**OpenSilício** - Capacitando a próxima geração de projetistas de chips 🚀
