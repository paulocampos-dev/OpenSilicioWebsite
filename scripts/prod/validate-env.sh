#!/bin/bash
# OpenSilicio - Validar Variaveis de Ambiente (Linux/Mac)

set -e

echo "========================================"
echo "OpenSilicio - Validacao de Ambiente"
echo "========================================"
echo ""

if [ ! -f .env ]; then
    echo "[ERRO] Arquivo .env nao encontrado!"
    echo "Copie o arquivo .env.example para .env e configure:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Carregar variaveis do .env
export $(grep -v '^#' .env | xargs)

echo "Verificando variaveis de ambiente..."
echo ""

ERRORS=0

# Verificar variaveis obrigatorias
if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "[ERRO] POSTGRES_PASSWORD nao definido"
    ERRORS=1
else
    echo "[OK] POSTGRES_PASSWORD definido"
fi

if [ -z "$JWT_SECRET" ]; then
    echo "[ERRO] JWT_SECRET nao definido"
    ERRORS=1
else
    if [ ${#JWT_SECRET} -lt 32 ]; then
        echo "[AVISO] JWT_SECRET muito curto (recomendado: pelo menos 32 caracteres)"
    else
        echo "[OK] JWT_SECRET definido"
    fi
fi

if [ -z "$VITE_API_URL" ]; then
    echo "[ERRO] VITE_API_URL nao definido"
    ERRORS=1
else
    echo "[OK] VITE_API_URL definido"
fi

# Verificar variaveis opcionais
if [ -z "$POSTGRES_DB" ]; then
    echo "[AVISO] POSTGRES_DB nao definido (usara padrao: opensilicio_prod)"
fi
if [ -z "$POSTGRES_USER" ]; then
    echo "[AVISO] POSTGRES_USER nao definido (usara padrao: opensilicio)"
fi
if [ -z "$CORS_ORIGINS" ]; then
    echo "[AVISO] CORS_ORIGINS nao definido (usara padrao: http://localhost)"
fi

echo ""
echo "[INFO] DATABASE_URL sera construido automaticamente pelo docker-compose"
echo ""
if [ $ERRORS -eq 1 ]; then
    echo "========================================"
    echo "[ERRO] Algumas variaveis obrigatorias estao faltando!"
    echo "Verifique o arquivo .env e configure todas as variaveis necessarias."
    echo "========================================"
    exit 1
else
    echo "========================================"
    echo "[OK] Todas as variaveis obrigatorias estao configuradas!"
    echo "========================================"
    exit 0
fi

