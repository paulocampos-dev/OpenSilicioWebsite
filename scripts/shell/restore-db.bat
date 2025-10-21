@echo off
REM OpenSilicio - Restaurar Backup do Banco de Dados (Windows)

echo ========================================
echo OpenSilicio - Restaurar Banco de Dados
echo ========================================
echo.

if "%1"=="" (
    echo [ERRO] Especifique o arquivo de backup!
    echo.
    echo Uso: %0 caminho\para\backup.sql
    echo.
    echo Backups disponiveis:
    dir /b backups\*.sql 2>nul
    pause
    exit /b 1
)

if not exist "%1" (
    echo [ERRO] Arquivo de backup nao encontrado: %1
    pause
    exit /b 1
)

REM Verificar se Docker esta rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    pause
    exit /b 1
)

echo [AVISO] Esta operacao vai SUBSTITUIR todos os dados atuais!
echo Arquivo: %1
echo.
set /p CONFIRM="Tem certeza? (digite 'SIM' para confirmar): "

if /i not "%CONFIRM%"=="SIM" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo Restaurando backup...
echo.

docker-compose -f docker\docker-compose.yml exec -T postgres psql -U opensilicio opensilicio_prod < "%1"

if errorlevel 1 (
    echo [ERRO] Falha ao restaurar backup!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Backup restaurado com sucesso! ✅
echo ========================================
echo.
pause

