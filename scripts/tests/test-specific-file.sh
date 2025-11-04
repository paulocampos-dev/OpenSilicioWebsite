#!/bin/bash

echo "========================================"
echo "OpenSilicio - Rodar Teste de Arquivo Especifico"
echo "========================================"
echo ""

# Verificar se arquivo foi fornecido
if [ -z "$1" ]; then
    echo "❌ Erro: Nenhum arquivo especificado!"
    echo ""
    echo "Uso:"
    echo "  ./test-specific-file.sh <caminho-do-arquivo>"
    echo ""
    echo "Exemplos:"
    echo "  ./test-specific-file.sh src/tests/integration/auth.test.ts"
    echo "  ./test-specific-file.sh src/tests/integration/blog.test.ts"
    echo ""
    exit 1
fi

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""
echo "🧪 Rodando testes para: $1"
echo ""

docker-compose -f docker/docker-compose.dev.yml --env-file .env exec -T backend npm run test:integration -- "$1"

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Alguns testes FALHARAM!"
    echo "   Verifique os erros acima."
    echo ""
    exit 1
else
    echo ""
    echo "✅ Testes PASSARAM!"
    echo ""
    exit 0
fi
