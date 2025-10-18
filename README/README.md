# OpenSilício - Website Completo

Um website completo para o grupo universitário OpenSilício, com sistema de gerenciamento de conteúdo, blog, área educacional e wiki integrada.

## 🚀 Funcionalidades

- **Landing Page** - Página inicial com informações sobre o grupo
- **Blog** - Sistema de posts com categorias e busca
- **Educação** - Recursos educacionais organizados por categoria
- **Wiki** - Dicionário de termos técnicos com links automáticos
- **Painel Administrativo** - Interface completa para gerenciar conteúdo
- **Editor Rico** - Suporte a WYSIWYG e Markdown com upload de imagens
- **Autenticação** - Sistema de login seguro com JWT
- **Docker** - Ambiente de desenvolvimento containerizado

## 🛠️ Tecnologias

### Backend
- Node.js + Express + TypeScript
- PostgreSQL
- JWT para autenticação
- Multer para upload de arquivos
- bcrypt para hash de senhas

### Frontend
- React + TypeScript
- Material-UI (MUI)
- TipTap para editor rico
- React Markdown
- Axios para requisições HTTP
- React Router para navegação

### DevOps
- Docker + Docker Compose
- Scripts de desenvolvimento automatizados

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
- Password: `Test123`

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
3. Faça login com as credenciais: `AdmOpen` / `Test123`
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

## 📈 Próximos Passos

- [ ] Sistema de comentários no blog
- [ ] Notificações por email
- [ ] Sistema de tags
- [ ] Busca avançada
- [ ] Analytics de visualizações
- [ ] Sistema de backup automático
- [ ] Deploy em produção

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
