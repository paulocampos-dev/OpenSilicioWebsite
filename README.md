# OpenSilício - Website Completo

Um website completo para o grupo universitário OpenSilício, com sistema de gerenciamento de conteúdo, blog, área educacional e wiki integrada.

## 🚀 Quick Start

### Desenvolvimento com Hot Reload (Recomendado)

```bash
# Windows
scripts\shell\dev-start.bat

# Linux/Mac
chmod +x scripts/shell/dev-start.sh
./scripts/shell/dev-start.sh
```

Isso iniciará todos os serviços em Docker com **hot reload automático**:
- 🔥 Backend: mudanças detectadas em ~2s
- ⚡ Frontend: HMR instantâneo

### Acesse a Aplicação

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

### Credenciais

- **Username**: `AdmOpen`
- **Password**: `Test123`

## 📚 Documentação Completa

Toda a documentação foi organizada em `README/`:

- **[README/README.md](README/README.md)** - Documentação completa do projeto
- **[README/QUICK_START.md](README/QUICK_START.md)** - Guia rápido de instalação
- **[README/DEV_SETUP.md](README/DEV_SETUP.md)** - Setup detalhado para desenvolvimento
- **[README/DOCKER_DEV_GUIDE.md](README/DOCKER_DEV_GUIDE.md)** - Guia Docker com hot reloading
- **[README/DOCKER_OPTIMIZATION_SUMMARY.md](README/DOCKER_OPTIMIZATION_SUMMARY.md)** - Resumo das otimizações
- **[README/.dockerdev-commands.md](README/.dockerdev-commands.md)** - Comandos Docker úteis
- **[README/DOCKER_PROJECT_NAME.md](README/DOCKER_PROJECT_NAME.md)** - Configuração do nome do projeto no Docker
- **[README/DATABASE_CONNECTION_FIXES.md](README/DATABASE_CONNECTION_FIXES.md)** - Correções de conexão com banco de dados
- **[README/DOCKER_NETWORKING.md](README/DOCKER_NETWORKING.md)** - Configuração de rede Docker (proxy fix)
- **[README/WIKI_LINKING_EXAMPLE.md](README/WIKI_LINKING_EXAMPLE.md)** - Exemplos de links na Wiki

## 🗂️ Estrutura do Projeto

```
site_react/
├── backend/                      # API Node.js/Express
│   ├── src/
│   │   ├── config/              # Configurações do banco
│   │   ├── controllers/         # Lógica de negócio
│   │   ├── middleware/          # Autenticação, validação
│   │   ├── routes/              # Rotas da API
│   │   ├── scripts/             # Scripts de migração
│   │   └── services/            # Serviços de negócio
│   └── uploads/                 # Arquivos uploadados
│
├── openSilicioWebsite/          # Frontend React + Vite
│   ├── src/
│   │   ├── components/          # Componentes reutilizáveis
│   │   ├── contexts/            # React Contexts
│   │   ├── pages/               # Páginas da aplicação
│   │   │   ├── admin/           # Painel administrativo
│   │   │   ├── Blog.tsx
│   │   │   ├── Educacao.tsx
│   │   │   ├── Landing.tsx
│   │   │   └── Wiki.tsx
│   │   ├── services/            # API client
│   │   └── types/               # TypeScript types
│   └── public/                  # Assets estáticos
│
├── docker/                       # Arquivos Docker
│   ├── docker-compose.yml       # Produção
│   ├── docker-compose.dev.yml   # Desenvolvimento (HOT RELOAD)
│   ├── Dockerfile.backend       # Backend produção
│   ├── Dockerfile.backend.dev   # Backend desenvolvimento
│   ├── Dockerfile.frontend      # Frontend produção
│   └── Dockerfile.frontend.dev  # Frontend desenvolvimento
│
├── scripts/                      # Scripts utilitários
│   └── shell/                    # Scripts shell/bat
│       ├── dev-start.bat        # Inicia dev (Windows)
│       ├── dev-start.sh         # Inicia dev (Linux/Mac)
│       ├── dev-local.bat        # Dev local (Windows)
│       ├── dev-local.sh         # Dev local (Linux/Mac)
│       ├── stop-dev.bat         # Para serviços (Windows)
│       └── stop-dev.sh          # Para serviços (Linux/Mac)
│
└── README/                       # Documentação
    ├── README.md                # Docs principal
    ├── QUICK_START.md
    ├── DEV_SETUP.md
    ├── DOCKER_DEV_GUIDE.md
    └── ...
```

## 🛠️ Tecnologias

- **Backend**: Node.js, Express, TypeScript, PostgreSQL
- **Frontend**: React, TypeScript, Material-UI, Vite
- **DevOps**: Docker, Docker Compose
- **Ferramentas**: Hot Module Replacement, ts-node-dev

## 🔥 Características

- ✅ Hot reload automático (backend + frontend)
- ✅ Sistema de autenticação com JWT
- ✅ Upload de imagens
- ✅ Editor rico (WYSIWYG + Markdown)
- ✅ Wiki com links automáticos entre termos
- ✅ Painel administrativo completo
- ✅ Responsive design
- ✅ Dark mode
- ✅ Docker pronto para produção

## 📝 Scripts Disponíveis

### Desenvolvimento
```bash
# Hot reload em Docker (Melhor opção!)
scripts/shell/dev-start.bat

# Desenvolvimento local (requer Node.js)
scripts/shell/dev-local.bat

# Parar serviços
scripts/shell/stop-dev.bat
```

### Docker
```bash
# Dev com hot reload
docker-compose -f docker/docker-compose.dev.yml up

# Produção
docker-compose -f docker/docker-compose.yml up --build

# Ver logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Parar e limpar
docker-compose -f docker/docker-compose.dev.yml down -v
```

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Equipe OpenSilício

Desenvolvido com ❤️ pelo grupo OpenSilício - Escola Politécnica da USP

---

**Para documentação detalhada, veja [README/README.md](README/README.md)**

