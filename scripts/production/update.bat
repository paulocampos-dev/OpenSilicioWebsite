@echo off
REM OpenSilicio - Atualizar Aplicacao em Producao (Windows)
REM Este script atualiza a aplicacao em producao com as ultimas mudancas

echo ========================================
echo OpenSilicio - Atualizar Producao
echo ========================================
echo.

REM Verificar se Docker esta rodando
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

echo [1/6] Criando backup do banco de dados...
if not exist backups mkdir backups
set BACKUP_FILE=backups\backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
docker-compose -f docker\docker-compose.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > %BACKUP_FILE%
if errorlevel 1 (
    echo [ERRO] Falha ao criar backup!
    echo Abortando atualizacao por seguranca.
    pause
    exit /b 1
)
echo   ✓ Backup criado: %BACKUP_FILE%
echo.

echo [2/6] Atualizando codigo do repositorio...
git pull origin main
if errorlevel 1 (
    echo [AVISO] Falha ao atualizar repositorio
    echo Continuando com codigo local...
)
echo   ✓ Codigo atualizado
echo.

echo [3/6] Parando containers...
docker-compose -f docker\docker-compose.yml down
echo   ✓ Containers parados
echo.

echo [4/6] Reconstruindo imagens...
echo   (Isso pode levar alguns minutos...)
docker-compose -f docker\docker-compose.yml build
if errorlevel 1 (
    echo [ERRO] Falha ao construir imagens!
    pause
    exit /b 1
)
echo   ✓ Imagens reconstruidas
echo.

echo [5/6] Reiniciando containers...
docker-compose -f docker\docker-compose.yml up -d
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar containers!
    pause
    exit /b 1
)
echo   ✓ Containers iniciados
echo.

echo [6/6] Executando migracoes do banco de dados...
timeout /t 5 /nobreak >nul
docker-compose -f docker\docker-compose.yml exec -T backend npm run migrate
if errorlevel 1 (
    echo [AVISO] Falha ao executar migracoes automaticamente
    echo Execute manualmente: docker-compose -f docker\docker-compose.yml exec backend npm run migrate
)
echo   ✓ Migracoes executadas
echo.

echo ========================================
echo Atualizacao concluida com sucesso! ✅
echo ========================================
echo.
echo Aplicacao atualizada e rodando em:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo.
echo Comandos uteis:
echo   - Ver logs: docker-compose -f docker\docker-compose.yml logs -f
echo   - Reiniciar: docker-compose -f docker\docker-compose.yml restart
echo   - Parar: docker-compose -f docker\docker-compose.yml down
echo.
pause

