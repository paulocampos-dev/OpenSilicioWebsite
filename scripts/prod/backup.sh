#!/bin/bash
# OpenSilicio - Backup Manual do Banco de Dados (Linux/Mac)

echo "========================================"
echo "OpenSilicio - Backup do Banco de Dados"
echo "========================================"
echo ""

# Verificar se Docker esta rodando
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker nao esta rodando!"
    exit 1
fi

# Criar diretorio de backups
mkdir -p backups

# Criar nome do arquivo com timestamp
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

echo "Criando backup em: $BACKUP_FILE"
echo ""

# Fazer backup
docker-compose -f docker/docker-compose.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > $BACKUP_FILE

if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao criar backup!"
    exit 1
fi

# Obter tamanho do arquivo
FILESIZE=$(du -h $BACKUP_FILE | cut -f1)

echo "========================================"
echo "Backup criado com sucesso! ✅"
echo "========================================"
echo ""
echo "Arquivo: $BACKUP_FILE"
echo "Tamanho: $FILESIZE"
echo ""
echo "Para restaurar este backup:"
echo "  scripts/shell/restore-db.sh $BACKUP_FILE"
echo ""

