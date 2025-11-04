@echo off
REM ==================================================
REM OpenSilicio - Alterar Senha do Administrador
REM ==================================================

echo.
echo ========================================
echo OpenSilicio - Alterar Senha Admin
echo ========================================
echo.

REM Verificar se o docker-compose está instalado
where docker-compose >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] docker-compose não encontrado!
    echo        Instale o Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Verificar se os containers estão rodando
docker-compose -f docker/docker-compose.prod.yml ps | findstr "Up" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Os containers de produção não parecem estar rodando.
    echo         Iniciando containers...
    docker-compose -f docker/docker-compose.prod.yml up -d
    echo.
    echo Aguardando containers iniciarem (10 segundos)...
    timeout /t 10 /nobreak >nul
)

echo Executando script de alteração de senha...
echo.

docker-compose -f docker/docker-compose.prod.yml exec backend npm run change-password

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Falha ao executar script de alteração de senha!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Operação concluída!
echo ========================================
pause

