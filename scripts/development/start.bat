@echo off
echo 🚀 Iniciando OpenSilicio em modo desenvolvimento com Hot Reload...

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker está rodando

REM Parar containers antigos se existirem
echo 🔄 Parando containers antigos...
docker-compose -f docker/docker-compose.dev.yml down -v

REM Iniciar containers
echo 🏗️  Construindo e iniciando containers...
docker-compose -f docker/docker-compose.dev.yml up --build -d

REM Aguardar o PostgreSQL estar pronto
echo ⏳ Aguardando PostgreSQL estar pronto...
timeout /t 10 /nobreak >nul

REM Executar migrações do banco de dados
echo 🗄️  Executando migrações do banco de dados...
docker-compose -f docker/docker-compose.dev.yml exec -T backend npm run migrate

REM Executar seed do admin
echo 👤 Criando usuário administrador...
docker-compose -f docker/docker-compose.dev.yml exec -T backend npx ts-node src/scripts/seedAdmin.ts

REM Executar seed de configurações
echo ⚙️  Inserindo configurações iniciais...
docker-compose -f docker/docker-compose.dev.yml exec -T backend npx ts-node src/scripts/seedSettings.ts

REM Executar migração de dados (se existir)
echo 📊 Migrando dados existentes...
docker-compose -f docker/docker-compose.dev.yml exec -T backend npx ts-node src/scripts/migrateData.ts 2>nul || echo ⚠️  Script de migração de dados não encontrado (OK se for primeira vez)

REM Testar conectividade do backend
echo 🔍 Testando conectividade do backend...
timeout /t 5 /nobreak >nul
curl -s http://localhost:3001/health >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Backend pode não estar pronto ainda. Aguarde alguns segundos.
) else (
    echo ✅ Backend está respondendo corretamente
)

echo.
echo ✅ OpenSilicio está rodando com Hot Reload!
echo.
echo 📡 Backend API: http://localhost:3001
echo 🌐 Frontend: http://localhost:5173
echo 🗄️  PostgreSQL: localhost:5432
echo.
echo 👤 Usuário Admin:
echo    Username: AdmOpen
echo    Password: ADMOpenSilicio123!@2025
echo.
echo 🔥 Hot Reload ATIVADO:
echo    - Backend: Edite arquivos em backend/src/ (~2s reload)
echo    - Frontend: Edite arquivos em openSilicioWebsite/src/ (instantâneo)
echo.
echo Para ver logs: docker-compose -f docker/docker-compose.dev.yml logs -f
echo Para parar: docker-compose -f docker/docker-compose.dev.yml down
echo.

REM Abrir navegador
start http://localhost:5173

pause

