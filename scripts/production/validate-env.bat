@echo off
REM OpenSilicio - Validar Variaveis de Ambiente (Windows)

echo ========================================
echo OpenSilicio - Validacao de Ambiente
echo ========================================
echo.

if not exist .env (
    echo [ERRO] Arquivo .env nao encontrado!
    echo Copie o arquivo .env.example para .env e configure:
    echo   copy .env.example .env
    echo   notepad .env
    pause
    exit /b 1
)

echo Verificando variaveis de ambiente...
echo.

set ERRORS=0

REM Carregar variaveis do .env
for /f "tokens=1,* delims==" %%a in (.env) do (
    set "%%a=%%b"
)

REM Verificar variaveis obrigatorias
if "%POSTGRES_PASSWORD%"=="" (
    echo [ERRO] POSTGRES_PASSWORD nao definido
    set ERRORS=1
) else (
    echo [OK] POSTGRES_PASSWORD definido
)

if "%JWT_SECRET%"=="" (
    echo [ERRO] JWT_SECRET nao definido
    set ERRORS=1
) else (
    if "!JWT_SECRET:~31,1!"=="" (
        echo [AVISO] JWT_SECRET muito curto (recomendado: pelo menos 32 caracteres)
    ) else (
        echo [OK] JWT_SECRET definido
    )
)

if "%VITE_API_URL%"=="" (
    echo [ERRO] VITE_API_URL nao definido
    set ERRORS=1
) else (
    echo [OK] VITE_API_URL definido
)

REM Verificar variaveis opcionais
if "%POSTGRES_DB%"=="" (
    echo [AVISO] POSTGRES_DB nao definido (usara padrao: opensilicio_prod)
)
if "%POSTGRES_USER%"=="" (
    echo [AVISO] POSTGRES_USER nao definido (usara padrao: opensilicio)
)
if "%CORS_ORIGINS%"=="" (
    echo [AVISO] CORS_ORIGINS nao definido (usara padrao: http://localhost)
)

echo.
echo [INFO] DATABASE_URL sera construido automaticamente pelo docker-compose
echo.

if %ERRORS%==1 (
    echo ========================================
    echo [ERRO] Algumas variaveis obrigatorias estao faltando!
    echo Verifique o arquivo .env e configure todas as variaveis necessarias.
    echo ========================================
    pause
    exit /b 1
) else (
    echo ========================================
    echo [OK] Todas as variaveis obrigatorias estao configuradas!
    echo ========================================
    pause
    exit /b 0
)

