#!/bin/bash
# OpenSilicio - Quick Start para Producao (Linux/Mac)
# Script simplificado para deploy rapido em producao

set -e

echo "========================================"
echo "OpenSilicio - Quick Start (Producao)"
echo "========================================"
echo ""

# Verificar Docker
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker nao esta rodando!"
    echo "Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Verificar .env
if [ ! -f .env ]; then
    echo "[CONFIGURACAO INICIAL]"
    echo "Arquivo .env nao encontrado."
    echo ""
    if [ -f .env.example ]; then
        echo "Copiando .env.example para .env..."
        cp .env.example .env
        echo ""
        echo "Arquivo .env criado! Por favor, configure as variaveis:"
        echo "  - POSTGRES_PASSWORD (senha forte)"
        echo "  - JWT_SECRET (string aleatoria de pelo menos 32 caracteres)"
        echo "  - DATABASE_URL (formato: postgresql://USER:PASSWORD@postgres:5432/DB)"
        echo "  - VITE_API_URL (URL da API em producao, ex: https://seu-dominio.com/api)"
        echo "  - CORS_ORIGINS (origens permitidas separadas por virgula)"
        echo ""
        echo "Abra o arquivo .env para edicao:"
        echo "  nano .env"
        echo ""
        read -p "Pressione Enter quando terminar de configurar o .env..."
    else
        echo "[ERRO] Arquivo .env.example nao encontrado!"
        echo "Por favor, crie manualmente o arquivo .env com as configuracoes necessarias."
        exit 1
    fi
fi

# Validar variaveis essenciais
echo "[1/2] Validando configuracoes..."
bash scripts/production/validate-env.sh
if [ $? -ne 0 ]; then
    echo ""
    echo "Por favor, corrija os erros no arquivo .env e execute novamente."
    exit 1
fi

# Executar deploy
echo ""
echo "[2/2] Executando deploy..."
bash scripts/production/deploy.sh

