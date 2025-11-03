# OpenSilício - Website Completo

Um website completo para o grupo universitário OpenSilício, com sistema de gerenciamento de conteúdo, blog, área educacional e wiki integrada.

## 🚀 Quick Start

### Desenvolvimento com Hot Reload (Recomendado)

```bash
# Windows
scripts\development\start.bat

# Linux/Mac
chmod +x scripts/development/start.sh
./scripts/development/start.sh
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
- **Password**: `ADMOpenSilicio123!@2025`

## 📚 Documentação Completa

Toda a documentação foi organizada em `README/`:

- **[README/README.md](README/README.md)** - Documentação completa do projeto
- **[README/DEPLOYMENT.md](README/DEPLOYMENT.md)** - Guia completo de deploy em produção
- **[README/DATA_SAFETY.md](README/DATA_SAFETY.md)** - Segurança e backup de dados
- **[README/SCRIPTS_GUIDE.md](README/SCRIPTS_GUIDE.md)** - Guia completo de todos os scripts

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
│   ├── development/              # Scripts de desenvolvimento
│   │   ├── start.bat/sh         # Inicia dev com hot reload
│   │   ├── local.bat/sh         # Dev local (sem Docker)
│   │   └── stop.bat/sh          # Para serviços
│   └── production/               # Scripts de produção
│       ├── deploy.bat/sh        # Deploy inicial
│       ├── update.bat/sh        # Atualizar aplicação
│       ├── backup.bat/sh        # Backup do banco
│       ├── restore.bat/sh       # Restaurar backup
│       └── migrate.bat          # Executar migrações
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
- ✅ Upload de imagens com otimização automática
- ✅ Editor rico com Lexical
- ✅ Wiki com links automáticos e pending links
- ✅ Sistema de migrações de banco de dados
- ✅ Painel administrativo completo
- ✅ Auto-save de conteúdo
- ✅ Responsive design
- ✅ Dark mode
- ✅ Docker pronto para produção
- ✅ Scripts de deployment automatizados
- ✅ Sistema de backup de banco de dados
- ✅ Testes de integração completos
- ✅ Frontend servido via Nginx em produção
- ✅ Validação de ambiente antes do deploy
- ✅ Console logs apenas em desenvolvimento

## 📝 Scripts Disponíveis

### Desenvolvimento
```bash
# Iniciar com hot reload (Docker)
scripts/development/start.bat      # Windows
scripts/development/start.sh       # Linux/Mac

# Desenvolvimento local (sem Docker)
scripts/development/local.bat      # Windows
scripts/development/local.sh       # Linux/Mac

# Parar serviços
scripts/development/stop.bat       # Windows
scripts/development/stop.sh        # Linux/Mac
```

### Produção
```bash
# Deploy rápido inicial (primeira vez)
scripts/production/quick-start.bat # Windows
scripts/production/quick-start.sh  # Linux/Mac

# Deploy inicial
scripts/production/deploy.bat      # Windows
scripts/production/deploy.sh       # Linux/Mac

# Atualizar aplicação
scripts/production/update.bat      # Windows
scripts/production/update.sh       # Linux/Mac

# Validar ambiente
scripts/production/validate-env.bat # Windows
scripts/production/validate-env.sh  # Linux/Mac

# Backup e restore
scripts/production/backup.bat      # Windows
scripts/production/backup.sh       # Linux/Mac
scripts/production/restore.bat     # Windows
scripts/production/restore.sh      # Linux/Mac

# Migrações
scripts/production/migrate.bat     # Windows
```

### Docker
```bash
# Dev com hot reload
docker-compose -f docker/docker-compose.dev.yml up

# Produção (usa docker-compose.prod.yml)
docker-compose -f docker/docker-compose.prod.yml up --build

# Ver logs
docker-compose -f docker/docker-compose.dev.yml logs -f    # Dev
docker-compose -f docker/docker-compose.prod.yml logs -f    # Produção

# Parar e limpar
docker-compose -f docker/docker-compose.dev.yml down -v      # Dev (seguro)
docker-compose -f docker/docker-compose.prod.yml down        # Produção (SEM -v para preservar dados!)
```

### Testes
```bash
cd backend
npm test                # Executar todos os testes
npm run test:watch      # Modo watch
npm run test:coverage   # Relatório de cobertura
npm run test:integration # Apenas testes de integração
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

