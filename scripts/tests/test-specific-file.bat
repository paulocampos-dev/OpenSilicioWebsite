@echo off
echo ========================================
echo OpenSilicio - Rodar Teste de Arquivo Especifico
echo ========================================
echo.

REM Verificar se arquivo foi fornecido
if "%1"=="" (
    echo ❌ Erro: Nenhum arquivo especificado!
    echo.
    echo Uso:
    echo   test-specific-file.bat ^<caminho-do-arquivo^>
    echo.
    echo Exemplos:
    echo   test-specific-file.bat src/tests/integration/auth.test.ts
    echo   test-specific-file.bat src/tests/integration/blog.test.ts
    echo.
    pause
    exit /b 1
)

REM Verificar se Docker está rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker não está rodando. Por favor, inicie o Docker Desktop.
    pause
    exit /b 1
)

echo ✅ Docker está rodando
echo.
echo 🧪 Rodando testes para: %1
echo.

docker-compose -f docker/docker-compose.dev.yml --env-file .env exec -T backend npm run test:integration -- %1

if errorlevel 1 (
    echo.
    echo ❌ Alguns testes FALHARAM!
    echo    Verifique os erros acima.
    echo.
    pause
    exit /b 1
) else (
    echo.
    echo ✅ Testes PASSARAM!
    echo.
    pause
    exit /b 0
)
