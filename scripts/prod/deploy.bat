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

echo [1/7] Verificando arquivo .env...
if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado!
    echo.
    echo Por favor, copie o arquivo .env.example para .env e configure:
    echo   copy .env.example .env
    echo   notepad .env
    echo.
    echo IMPORTANTE: Configure pelo menos:
    echo   - POSTGRES_PASSWORD (senha forte)
    echo   - JWT_SECRET (string aleatoria de pelo menos 32 caracteres)
    echo   - VITE_API_URL (URL da API em producao)
    echo   - CORS_ORIGINS (origens permitidas separadas por virgula)
    echo   - POSTGRES_DB (opcional, padrao: opensilicio_prod)
    echo   - POSTGRES_USER (opcional, padrao: opensilicio)
    echo.
    echo NOTA: DATABASE_URL sera construido automaticamente pelo docker-compose
    echo.
    pause
    exit /b 1
)
echo   ✓ Arquivo .env encontrado

REM Validar variaveis essenciais
echo [2/7] Validando variaveis de ambiente...
set MISSING_VARS=0
if "%POSTGRES_PASSWORD%"=="" set MISSING_VARS=1
if "%JWT_SECRET%"=="" set MISSING_VARS=1
if "%VITE_API_URL%"=="" set MISSING_VARS=1

REM Carregar variaveis do .env
for /f "tokens=1,* delims==" %%a in (.env) do (
    set "%%a=%%b"
)

if "%POSTGRES_PASSWORD%"=="" (
    echo [AVISO] POSTGRES_PASSWORD nao definido no .env
    set MISSING_VARS=1
)
if "%JWT_SECRET%"=="" (
    echo [AVISO] JWT_SECRET nao definido no .env
    set MISSING_VARS=1
)
if "%VITE_API_URL%"=="" (
    echo [AVISO] VITE_API_URL nao definido no .env
    set MISSING_VARS=1
)

if %MISSING_VARS%==1 (
    echo [ERRO] Variaveis essenciais faltando no .env!
    echo Por favor, verifique o arquivo .env.example e configure todas as variaveis necessarias.
    pause
    exit /b 1
)
echo   ✓ Variaveis validadas
echo.

echo [3/7] Parando containers existentes...
docker-compose -f docker\docker-compose.prod.yml down
echo   ✓ Containers parados
echo.

echo [4/7] Construindo imagens de producao...
echo   (Isso pode levar alguns minutos...)
docker-compose -f docker\docker-compose.prod.yml build --no-cache
if errorlevel 1 (
    echo [ERRO] Falha ao construir imagens!
    pause
    exit /b 1
)
echo   ✓ Imagens construidas
echo.

echo [5/7] Iniciando containers em producao...
docker-compose -f docker\docker-compose.prod.yml up -d
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar containers!
    pause
    exit /b 1
)
echo   ✓ Containers iniciados
echo.

echo [6/7] Aguardando banco de dados inicializar...
timeout /t 15 /nobreak >nul
echo   ✓ Banco de dados pronto
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

REM Perguntar sobre seed de admin
echo Deseja criar o usuario administrador padrao?
echo   Username: AdmOpen
if not "%ADMIN_PASSWORD%"=="" (
    echo   Password: %ADMIN_PASSWORD%
) else (
    echo   Password: Dev123!@LocalOnly ^(padrao de desenvolvimento^)
    echo   [AVISO] Configure ADMIN_PASSWORD no .env para producao!
)
set /p CREATE_ADMIN="Criar usuario admin? (S/N): "
if /i "%CREATE_ADMIN%"=="S" (
    echo Criando usuario administrador...
    docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run seed:admin
    if errorlevel 1 (
        echo [AVISO] Falha ao criar usuario admin automaticamente
    )
)

REM Perguntar sobre seed de settings
echo.
echo Deseja inserir configuracoes iniciais do site?
set /p SEED_SETTINGS="Inserir configuracoes? (S/N): "
if /i "%SEED_SETTINGS%"=="S" (
    echo Inserindo configuracoes iniciais...
    docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run seed:settings
    if errorlevel 1 (
        echo [AVISO] Falha ao inserir configuracoes automaticamente
    )
)

echo.
echo ========================================
echo Deploy concluido com sucesso! 🚀
echo ========================================
echo.
echo Aplicacao rodando em:
echo   - Frontend: http://localhost:80
echo   - Backend:  http://localhost:3001
echo.
echo Comandos uteis:
echo   - Ver logs: docker-compose -f docker\docker-compose.prod.yml logs -f
echo   - Criar admin: docker-compose -f docker\docker-compose.prod.yml exec backend npm run seed:admin
echo   - Parar: docker-compose -f docker\docker-compose.prod.yml down
echo.
pause
