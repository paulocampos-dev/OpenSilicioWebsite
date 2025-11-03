# Scripts OpenSilício

Scripts de automação para desenvolvimento e produção.

## 📁 Estrutura

```
scripts/
├── dev/          → Scripts de desenvolvimento
│   ├── start     → Iniciar ambiente
│   ├── stop      → Parar ambiente
│   └── README.md → Documentação completa
│
├── prod/         → Scripts de produção
│   ├── deploy           → Deploy inicial
│   ├── update           → Atualizar aplicação
│   ├── backup           → Backup do banco
│   ├── restore          → Restaurar backup
│   ├── quick-start      → Deploy simplificado
│   ├── test             → Testar produção
│   ├── validate-env     → Validar .env
│   └── README.md        → Documentação completa
│
└── README.md     → Este arquivo
```

---

## 🚀 Início Rápido

### Desenvolvimento
```bash
# Iniciar ambiente de desenvolvimento
.\scripts\dev\start.bat        # Windows
./scripts/dev/start.sh         # Linux/Mac

# Parar
.\scripts\dev\stop.bat         # Windows
./scripts/dev/stop.sh          # Linux/Mac
```

### Produção
```bash
# Primeiro deploy
.\scripts\prod\quick-start.bat # Windows
./scripts/prod/quick-start.sh  # Linux/Mac

# Atualizar depois
.\scripts\prod\update.bat      # Windows
./scripts/prod/update.sh       # Linux/Mac
```

---

## 📚 Documentação Completa

- **[Desenvolvimento](dev/README.md)** - Guia completo dos scripts de dev
- **[Produção](prod/README.md)** - Guia completo dos scripts de prod

---

## 🔀 Diferenças: Dev vs Prod

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| **Docker** | docker-compose.dev.yml | docker-compose.prod.yml |
| **Build** | Sem build, volumes montados | Multi-stage build otimizado |
| **Hot-reload** | ✅ Sim | ❌ Não |
| **Portas** | 5173 (Frontend), 3001 (Backend) | 80 (Frontend), 3001 (Backend) |
| **Nginx** | ❌ Não usa | ✅ Serve frontend |
| **Otimização** | Desenvolvimento | Minificado, otimizado |
| **Logs** | Verbose | Produção |

---

## 🛠️ Tecnologias Usadas

- **Docker & Docker Compose** - Containerização
- **Bash/Batch** - Scripts multiplataforma
- **PostgreSQL** - Banco de dados
- **Node.js** - Backend e build
- **Nginx** - Servidor web (produção)

---

## 🆘 Precisa de Ajuda?

1. **Documentação específica:**
   - [Scripts de Dev](dev/README.md)
   - [Scripts de Prod](prod/README.md)
   - [Guia de Scripts](../README/SCRIPTS_GUIDE.md)
   - [Guia de Desenvolvimento](../README/DEVELOPMENT_GUIDE.md)

2. **Comandos úteis:**
   ```bash
   # Ver logs
   docker-compose -f docker/docker-compose.dev.yml logs -f
   docker-compose -f docker/docker-compose.prod.yml logs -f
   
   # Status dos containers
   docker ps
   
   # Limpar tudo
   docker-compose down -v
   ```

3. **Problemas comuns:**
   - Porta em uso → Mude no .env ou pare processo
   - Docker não roda → Inicie Docker Desktop
   - .env não encontrado → Copie de .env.example

---

## 📝 Notas

- **Sempre execute scripts da raiz do projeto**
- **Windows:** Use PowerShell ou CMD
- **Linux/Mac:** Dê permissão de execução: `chmod +x scripts/**/*.sh`
- **`.env` fica na raiz** (não em subdiretórios)

---

## 🔄 Convenções

- `.bat` - Scripts Windows
- `.sh` - Scripts Linux/Mac
- Sempre em pares (bat + sh) para compatibilidade

---

Desenvolvido com ❤️ para OpenSilício

