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

REM Verificar se .env existe
if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado!
    echo Execute primeiro o script de deploy: scripts\production\deploy.bat
    pause
    exit /b 1
)

echo [1/7] Criando backup do banco de dados...
if not exist backups mkdir backups
set BACKUP_FILE=backups\backup_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%

REM Carregar variaveis do .env para obter credenciais do banco
for /f "tokens=1,* delims==" %%a in (.env) do (
    set "%%a=%%b"
)

REM Usar variaveis do .env ou valores padrao
set PG_USER=%POSTGRES_USER%
if "%PG_USER%"=="" set PG_USER=opensilicio
set PG_DB=%POSTGRES_DB%
if "%PG_DB%"=="" set PG_DB=opensilicio_prod

docker-compose -f docker\docker-compose.prod.yml exec -T postgres pg_dump -U %PG_USER% %PG_DB% > %BACKUP_FILE%
if errorlevel 1 (
    echo [ERRO] Falha ao criar backup!
    echo Abortando atualizacao por seguranca.
    pause
    exit /b 1
)
echo   ✓ Backup criado: %BACKUP_FILE%
echo.

echo [2/7] Atualizando codigo do repositorio...
git pull origin main
if errorlevel 1 (
    echo [AVISO] Falha ao atualizar repositorio
    echo Continuando com codigo local...
)
echo   ✓ Codigo atualizado
echo.

echo [3/7] Parando containers...
docker-compose -f docker\docker-compose.prod.yml down
echo   ✓ Containers parados
echo.

echo [4/7] Reconstruindo imagens de producao...
echo   (Isso pode levar alguns minutos...)
docker-compose -f docker\docker-compose.prod.yml build
if errorlevel 1 (
    echo [ERRO] Falha ao construir imagens!
    pause
    exit /b 1
)
echo   ✓ Imagens reconstruidas
echo.

echo [5/7] Reiniciando containers...
docker-compose -f docker\docker-compose.prod.yml up -d
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar containers!
    pause
    exit /b 1
)
echo   ✓ Containers iniciados
echo.

echo [6/7] Aguardando servicos iniciarem...
timeout /t 10 /nobreak >nul
echo   ✓ Servicos prontos
echo.

echo [7/7] Executando migracoes do banco de dados...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run migrate
if errorlevel 1 (
    echo [AVISO] Falha ao executar migracoes automaticamente
    echo Execute manualmente: docker-compose -f docker\docker-compose.prod.yml exec backend npm run migrate
) else (
    echo   ✓ Migracoes executadas
)
echo.

echo ========================================
echo Atualizacao concluida com sucesso! ✅
echo ========================================
echo.
echo Aplicacao atualizada e rodando em:
echo   - Frontend: http://localhost:80
echo   - Backend:  http://localhost:3001
echo.
echo Backup salvo em: %BACKUP_FILE%
echo.
echo Comandos uteis:
echo   - Ver logs: docker-compose -f docker\docker-compose.prod.yml logs -f
echo   - Reiniciar: docker-compose -f docker\docker-compose.prod.yml restart
echo   - Parar: docker-compose -f docker\docker-compose.prod.yml down
echo.
pause
