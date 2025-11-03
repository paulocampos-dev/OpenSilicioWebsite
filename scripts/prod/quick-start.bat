@echo off
REM OpenSilicio - Quick Start para Producao (Windows)
REM Script simplificado para deploy rapido em producao

echo ========================================
echo OpenSilicio - Quick Start (Producao)
echo ========================================
echo.

REM Verificar Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Docker nao esta rodando!
    echo Por favor, inicie o Docker Desktop e tente novamente.
    pause
    exit /b 1
)

REM Verificar .env
if not exist .env (
    echo [CONFIGURACAO INICIAL]
    echo Arquivo .env nao encontrado.
    echo.
    if exist .env.example (
        echo Copiando .env.example para .env...
        copy .env.example .env
        echo.
        echo Arquivo .env criado! Por favor, configure as variaveis:
        echo   - POSTGRES_PASSWORD (senha forte)
        echo   - JWT_SECRET (string aleatoria de pelo menos 32 caracteres)
        echo   - DATABASE_URL (formato: postgresql://USER:PASSWORD@postgres:5432/DB)
        echo   - VITE_API_URL (URL da API em producao, ex: https://seu-dominio.com/api)
        echo   - CORS_ORIGINS (origens permitidas separadas por virgula)
        echo.
        echo Abrindo arquivo .env para edicao...
        timeout /t 2 /nobreak >nul
        notepad .env
        echo.
        echo Pressione qualquer tecla quando terminar de configurar o .env...
        pause >nul
    ) else (
        echo [ERRO] Arquivo .env.example nao encontrado!
        echo Por favor, crie manualmente o arquivo .env com as configuracoes necessarias.
        pause
        exit /b 1
    )
)

REM Validar variaveis essenciais
echo [1/2] Validando configuracoes...
call scripts\production\validate-env.bat
if errorlevel 1 (
    echo.
    echo Por favor, corrija os erros no arquivo .env e execute novamente.
    pause
    exit /b 1
)

REM Executar deploy
echo.
echo [2/2] Executando deploy...
call scripts\production\deploy.bat

