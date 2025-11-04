#!/bin/bash

echo "========================================"
echo "OpenSilício - Iniciar com Testes"
echo "========================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Executar o script de start normal
"$SCRIPT_DIR/start.sh"

echo ""
echo "========================================"
echo "Executando Testes de Integração"
echo "========================================"
echo ""

# Aguardar um pouco mais para garantir que tudo está estável
echo "⏳ Aguardando ambiente estabilizar (5 segundos)..."
sleep 5

# Executar testes de integração
echo "🧪 Rodando testes de integração..."
echo ""

docker-compose -f "$SCRIPT_DIR/../../docker/docker-compose.dev.yml" exec -T backend npm run test:integration

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Alguns testes FALHARAM!"
    echo "   Verifique os erros acima."
    echo ""
else
    echo ""
    echo "✅ Todos os testes PASSARAM!"
    echo ""
fi

echo "========================================"
echo "Resumo"
echo "========================================"
echo ""
echo "✅ Ambiente de desenvolvimento rodando"
echo "🧪 Testes de integração executados"
echo ""
echo "📡 Backend API: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo ""
echo "Para rodar testes novamente:"
echo "  docker-compose -f docker/docker-compose.dev.yml exec backend npm test"
echo ""
echo "Para ver logs:"
echo "  docker-compose -f docker/docker-compose.dev.yml logs -f"
echo ""
echo "Para parar:"
echo "  docker-compose -f docker/docker-compose.dev.yml down"
echo ""

