#!/bin/bash

echo "========================================"
echo "OpenSilicio - Rodar Testes em Watch Mode"
echo "========================================"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""
echo "👀 Rodando testes em watch mode (auto-rerun ao detectar alterações)..."
echo "   Pressione CTRL+C para sair."
echo ""

docker-compose -f docker/docker-compose.dev.yml --env-file .env exec backend npm test -- --watch
