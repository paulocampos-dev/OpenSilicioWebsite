#!/bin/bash
# OpenSilicio - Restaurar Backup do Banco de Dados (Linux/Mac)

echo "========================================"
echo "OpenSilicio - Restaurar Banco de Dados"
echo "========================================"
echo ""

if [ -z "$1" ]; then
    echo "[ERRO] Especifique o arquivo de backup!"
    echo ""
    echo "Uso: $0 caminho/para/backup.sql"
    echo ""
    echo "Backups disponiveis:"
    ls -1 backups/*.sql 2>/dev/null || echo "  Nenhum backup encontrado"
    exit 1
fi

if [ ! -f "$1" ]; then
    echo "[ERRO] Arquivo de backup nao encontrado: $1"
    exit 1
fi

# Verificar se Docker esta rodando
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker nao esta rodando!"
    exit 1
fi

echo "[AVISO] Esta operacao vai SUBSTITUIR todos os dados atuais!"
echo "Arquivo: $1"
echo ""
read -p "Tem certeza? (digite 'SIM' para confirmar): " CONFIRM

if [ "$CONFIRM" != "SIM" ]; then
    echo "Operacao cancelada."
    exit 0
fi

echo ""
echo "Restaurando backup..."
echo ""

docker-compose -f docker/docker-compose.yml exec -T postgres psql -U opensilicio opensilicio_prod < "$1"

if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao restaurar backup!"
    exit 1
fi

echo ""
echo "========================================"
echo "Backup restaurado com sucesso! ✅"
echo "========================================"
echo ""

