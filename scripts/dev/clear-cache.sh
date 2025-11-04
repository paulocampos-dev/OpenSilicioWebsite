#!/bin/bash

echo "========================================"
echo "OpenSilício - Limpar Cache e Rebuildar"
echo "========================================"
echo ""

echo "[1/4] Parando containers..."
docker-compose -f docker/docker-compose.dev.yml down

echo ""
echo "[2/4] Removendo volumes (node_modules, cache)..."
docker-compose -f docker/docker-compose.dev.yml down -v

echo ""
echo "[3/4] Limpando cache do Docker..."
docker builder prune -f

echo ""
echo "[4/4] Removendo imagens antigas..."
docker-compose -f docker/docker-compose.dev.yml rm -f

echo ""
echo "========================================"
echo "✅ Cache limpo com sucesso!"
echo "========================================"
echo ""
echo "Agora execute: ./scripts/dev/start.sh"
echo ""

