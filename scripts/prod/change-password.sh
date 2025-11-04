#!/bin/bash

# ==================================================
# OpenSilicio - Alterar Senha do Administrador
# ==================================================

echo ""
echo "========================================"
echo "OpenSilicio - Alterar Senha Admin"
echo "========================================"
echo ""

# Verificar se o docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "[ERRO] docker-compose não encontrado!"
    echo "       Instale o Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se os containers estão rodando
if ! docker-compose -f docker/docker-compose.prod.yml ps | grep -q "Up"; then
    echo "[AVISO] Os containers de produção não parecem estar rodando."
    echo "        Iniciando containers..."
    docker-compose -f docker/docker-compose.prod.yml up -d
    echo ""
    echo "Aguardando containers iniciarem (10 segundos)..."
    sleep 10
fi

echo "Executando script de alteração de senha..."
echo ""

docker-compose -f docker/docker-compose.prod.yml exec backend npm run change-password

if [ $? -ne 0 ]; then
    echo ""
    echo "[ERRO] Falha ao executar script de alteração de senha!"
    exit 1
fi

echo ""
echo "========================================"
echo "Operação concluída!"
echo "========================================"

