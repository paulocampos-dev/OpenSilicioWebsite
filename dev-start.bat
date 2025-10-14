@echo off
echo 🚀 Iniciando OpenSilicio em modo desenvolvimento...

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
docker-compose down -v

REM Iniciar containers
echo 🏗️  Construindo e iniciando containers...
docker-compose up --build -d

REM Aguardar o PostgreSQL estar pronto
echo ⏳ Aguardando PostgreSQL estar pronto...
timeout /t 10 /nobreak >nul

REM Executar seed do admin
echo 👤 Criando usuário administrador...
docker-compose exec -T backend npx ts-node src/scripts/seedAdmin.ts

REM Executar migração de dados
echo 📊 Migrando dados existentes...
docker-compose exec -T backend npx ts-node src/scripts/migrateData.ts

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
echo ✅ OpenSilicio está rodando!
echo.
echo 📡 Backend API: http://localhost:3001
echo 🌐 Frontend: http://localhost:5173
echo 🗄️  PostgreSQL: localhost:5432
echo.
echo 👤 Usuário Admin:
echo    Username: AdmOpen
echo    Password: Test123
echo.
echo Para ver logs: docker-compose logs -f
echo Para parar: docker-compose down
echo.

REM Abrir navegador
start http://localhost:5173

pause

