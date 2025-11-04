@echo off
echo ========================================
echo OpenSilicio - Rodar Testes em Watch Mode
echo ========================================
echo.

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker está rodando
echo.
echo 👀 Rodando testes em watch mode (auto-rerun ao detectar alterações)...
echo    Pressione CTRL+C para sair.
echo.

docker-compose -f docker/docker-compose.dev.yml --env-file .env exec backend npm test -- --watch

pause
