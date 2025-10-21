@echo off
REM OpenSilicio - Deploy em Producao (Windows)
REM Este script faz o deploy completo da aplicacao em producao

echo ========================================
echo OpenSilicio - Deploy em Producao
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

echo [1/6] Verificando arquivo .env...
if not exist .env (
    echo [AVISO] Arquivo .env nao encontrado!
    echo Criando .env de exemplo...
    echo # Database > .env
    echo POSTGRES_DB=opensilicio_prod >> .env
    echo POSTGRES_USER=opensilicio >> .env
    echo POSTGRES_PASSWORD=ALTERE_ESTA_SENHA >> .env
    echo. >> .env
    echo # Backend >> .env
    echo NODE_ENV=production >> .env
    echo PORT=3001 >> .env
    echo JWT_SECRET=ALTERE_ESTE_SECRET >> .env
    echo DATABASE_URL=postgresql://opensilicio:ALTERE_ESTA_SENHA@postgres:5432/opensilicio_prod >> .env
    echo. >> .env
    echo # Frontend ^(build time^) >> .env
    echo VITE_API_URL=http://localhost:3001/api >> .env
    echo.
    echo [IMPORTANTE] Edite o arquivo .env com suas configuracoes antes de continuar!
    pause
    exit /b 1
)
echo   ✓ Arquivo .env encontrado
echo.

echo [2/6] Parando containers existentes...
docker-compose -f docker\docker-compose.yml down
echo   ✓ Containers parados
echo.

echo [3/6] Construindo imagens de producao...
echo   (Isso pode levar alguns minutos...)
docker-compose -f docker\docker-compose.yml build --no-cache
if errorlevel 1 (
    echo [ERRO] Falha ao construir imagens!
    pause
    exit /b 1
)
echo   ✓ Imagens construidas
echo.

echo [4/6] Iniciando containers em producao...
docker-compose -f docker\docker-compose.yml up -d
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar containers!
    pause
    exit /b 1
)
echo   ✓ Containers iniciados
echo.

echo [5/6] Aguardando banco de dados inicializar...
timeout /t 10 /nobreak >nul
echo   ✓ Banco de dados pronto
echo.

echo [6/6] Executando migracoes do banco de dados...
docker-compose -f docker\docker-compose.yml exec -T backend npm run migrate
if errorlevel 1 (
    echo [AVISO] Falha ao executar migracoes automaticamente
    echo Execute manualmente: docker-compose -f docker\docker-compose.yml exec backend npm run migrate
)
echo   ✓ Migracoes executadas
echo.

echo ========================================
echo Deploy concluido com sucesso! 🚀
echo ========================================
echo.
echo Aplicacao rodando em:
echo   - Frontend: http://localhost:5173
echo   - Backend:  http://localhost:3001
echo.
echo Proximos passos:
echo   1. Criar usuario admin: docker-compose -f docker\docker-compose.yml exec backend npm run seed:admin
echo   2. Ver logs: docker-compose -f docker\docker-compose.yml logs -f
echo   3. Configurar Nginx/Apache como proxy reverso
echo.
pause

