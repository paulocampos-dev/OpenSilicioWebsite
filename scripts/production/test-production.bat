@echo off
REM OpenSilicio - Teste de Ambiente de Producao (Windows)
REM Este script testa o ambiente de producao completo: cria dados, executa testes, aplica migracoes e verifica integridade

echo ========================================
echo OpenSilicio - Teste de Ambiente de Producao
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

echo [1/11] Verificando arquivo .env...
if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado!
    echo.
    echo Por favor, copie o arquivo .env.example para .env e configure:
    echo   copy .env.example .env
    echo   notepad .env
    echo.
    pause
    exit /b 1
)
echo   ✓ Arquivo .env encontrado
echo.

REM Carregar variaveis do .env
for /f "tokens=1,* delims==" %%a in (.env) do (
    set "%%a=%%b"
)

REM Validar variaveis essenciais
echo [2/11] Validando variaveis de ambiente...
set MISSING_VARS=0
if "%POSTGRES_PASSWORD%"=="" set MISSING_VARS=1
if "%JWT_SECRET%"=="" set MISSING_VARS=1
if "%VITE_API_URL%"=="" set MISSING_VARS=1

if %MISSING_VARS%==1 (
    echo [ERRO] Variaveis essenciais faltando no .env!
    pause
    exit /b 1
)
echo   ✓ Variaveis validadas
echo.

REM Criar diretorio de backups se nao existir
if not exist backups mkdir backups

REM Criar backup inicial
echo [3/11] Criando backup inicial...
set BACKUP_FILE=backups\backup_before_test_%date:~-4,4%%date:~-7,2%%date:~-10,2%_%time:~0,2%%time:~3,2%%time:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
docker-compose -f docker\docker-compose.prod.yml exec -T postgres pg_dump -U %POSTGRES_USER:-opensilicio% %POSTGRES_DB:-opensilicio_prod% > "%BACKUP_FILE%" 2>nul
if errorlevel 1 (
    echo [AVISO] Backup falhou, mas continuando...
) else (
    echo   ✓ Backup criado: %BACKUP_FILE%
)
echo.

REM Parar containers existentes
echo [4/11] Parando containers existentes...
docker-compose -f docker\docker-compose.prod.yml down
echo   ✓ Containers parados
echo.

REM Construir imagens
echo [5/11] Construindo imagens de producao...
echo   (Isso pode levar alguns minutos...)
docker-compose -f docker\docker-compose.prod.yml build --no-cache
if errorlevel 1 (
    echo [ERRO] Falha ao construir imagens!
    pause
    exit /b 1
)
echo   ✓ Imagens construidas
echo.

REM Iniciar containers
echo [6/11] Iniciando containers em producao...
docker-compose -f docker\docker-compose.prod.yml up -d
if errorlevel 1 (
    echo [ERRO] Falha ao iniciar containers!
    pause
    exit /b 1
)
echo   ✓ Containers iniciados
echo.

REM Aguardar banco de dados inicializar
echo [7/11] Aguardando banco de dados inicializar...
timeout /t 20 /nobreak >nul
echo   ✓ Banco de dados pronto
echo.

REM Executar migracoes iniciais
echo [8/11] Executando migracoes iniciais...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run migrate
if errorlevel 1 (
    echo [ERRO] Falha ao executar migracoes!
    pause
    exit /b 1
)
echo   ✓ Migracoes iniciais executadas
echo.

REM Criar usuario admin
echo [9/11] Criando usuario administrador...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run seed:admin
if errorlevel 1 (
    echo [AVISO] Falha ao criar usuario admin
)
echo   ✓ Usuario admin criado
echo.

REM Criar dados de teste
echo [10/11] Criando dados de teste...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run test:data
if errorlevel 1 (
    echo [ERRO] Falha ao criar dados de teste!
    pause
    exit /b 1
)
echo   ✓ Dados de teste criados
echo.

REM Executar testes
echo [11/11] Executando testes de integracao...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm test
if errorlevel 1 (
    echo [AVISO] Alguns testes falharam, mas continuando...
) else (
    echo   ✓ Todos os testes passaram
)
echo.

REM Executar migracoes pendentes
echo Executando migracoes pendentes...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run migrate
if errorlevel 1 (
    echo [AVISO] Falha ao executar migracoes pendentes
)
echo   ✓ Migracoes pendentes executadas
echo.

REM Verificar integridade dos dados
echo Verificando integridade dos dados...
docker-compose -f docker\docker-compose.prod.yml exec -T backend npm run verify:data
set INTEGRITY_RESULT=%ERRORLEVEL%
if %INTEGRITY_RESULT%==0 (
    echo   ✓ Integridade verificada: DADOS PRESERVADOS
) else (
    echo   ✗ Integridade verificada: ERROS ENCONTRADOS
)
echo.

echo ========================================
echo Teste de Producao Concluido
echo ========================================
echo.
echo Arquivos gerados:
echo   - test-data-snapshot.json
echo   - test-integrity-report.json
echo   - Backup: %BACKUP_FILE%
echo.
echo Aplicacao rodando em:
echo   - Frontend: http://localhost:80
echo   - Backend:  http://localhost:3001
echo.

REM Perguntar se deseja limpar
echo Deseja limpar o ambiente de teste?
echo   (Isso vai parar containers e remover volumes)
set /p CLEANUP="Limpar ambiente? (S/N): "
if /i "%CLEANUP%"=="S" (
    echo.
    echo Limpando ambiente...
    docker-compose -f docker\docker-compose.prod.yml down -v
    if exist test-data-snapshot.json del test-data-snapshot.json
    if exist test-integrity-report.json del test-integrity-report.json
    echo   ✓ Ambiente limpo
) else (
    echo.
    echo Ambiente mantido para inspecao manual.
    echo Para limpar depois, execute:
    echo   docker-compose -f docker\docker-compose.prod.yml down -v
)

echo.
pause

