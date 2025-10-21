@echo off
REM OpenSilicio - Backup Manual do Banco de Dados (Windows)

echo ========================================
echo OpenSilicio - Backup do Banco de Dados
echo ========================================
echo.

REM Verificar se Docker esta rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    pause
    exit /b 1
)

REM Criar diretorio de backups
if not exist backups mkdir backups

REM Criar nome do arquivo com timestamp
set BACKUP_FILE=backups\backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

echo Criando backup em: %BACKUP_FILE%
echo.

REM Fazer backup
docker-compose -f docker\docker-compose.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > %BACKUP_FILE%

if errorlevel 1 (
    echo [ERRO] Falha ao criar backup!
    pause
    exit /b 1
)

echo ========================================
echo Backup criado com sucesso! ✅
echo ========================================
echo.
echo Arquivo: %BACKUP_FILE%
echo Tamanho: 
for %%A in (%BACKUP_FILE%) do echo %%~zA bytes
echo.
echo Para restaurar este backup:
echo   scripts\shell\restore-db.bat %BACKUP_FILE%
echo.
pause

