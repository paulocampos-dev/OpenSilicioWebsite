@echo off
echo ========================================
echo OpenSilicio - Rodar Testes de Integracao
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
echo 🧪 Rodando testes de integração...
echo.

docker-compose -f docker/docker-compose.dev.yml --env-file .env exec -T backend npm run test:integration

if errorlevel 1 (
    echo.
    echo ❌ Alguns testes FALHARAM!
    echo    Verifique os erros acima.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Todos os testes PASSARAM!
    echo.
    pause
    exit /b 0
)
