#!/bin/bash

echo "========================================"
echo "OpenSilicio - Rodar Todos os Testes"
echo "========================================"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""
echo "🧪 Rodando todos os testes (unit + integration)..."
echo ""

docker-compose -f docker/docker-compose.dev.yml --env-file .env exec -T backend npm test

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Alguns testes FALHARAM!"
    echo "   Verifique os erros acima."
    echo ""
    exit 1
else
    echo ""
    echo "✅ Todos os testes PASSARAM!"
    echo ""
    exit 0
fi
