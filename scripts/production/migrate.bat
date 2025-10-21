@echo off
echo 🗄️  Executando migrações do banco de dados...
echo.

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)

REM Verificar se o backend está rodando
docker ps | findstr "opensilicio-backend-dev" >nul 2>&1
if errorlevel 1 (
    echo ❌ Backend não está rodando.
    echo.
    echo Por favor, inicie o ambiente de desenvolvimento primeiro:
    echo scripts\shell\dev-start.bat
    pause
    exit /b 1
)

echo ✅ Backend está rodando
echo.

REM Executar migrações
docker-compose -f docker/docker-compose.dev.yml exec -T backend npm run migrate

echo.
echo ✅ Migrações concluídas!
echo.
pause
