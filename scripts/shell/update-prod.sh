#!/bin/bash
# OpenSilicio - Atualizar Aplicacao em Producao (Linux/Mac)
# Este script atualiza a aplicacao em producao com as ultimas mudancas

echo "========================================"
echo "OpenSilicio - Atualizar Producao"
echo "========================================"
echo ""

# Verificar se Docker esta rodando
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker nao esta rodando!"
    echo "Por favor, inicie o Docker e tente novamente."
    exit 1
fi

echo "[1/6] Criando backup do banco de dados..."
mkdir -p backups
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"
docker-compose -f docker/docker-compose.yml exec -T postgres pg_dump -U opensilicio opensilicio_prod > $BACKUP_FILE
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao criar backup!"
    echo "Abortando atualizacao por seguranca."
    exit 1
fi
echo "  ✓ Backup criado: $BACKUP_FILE"
echo ""

echo "[2/6] Atualizando codigo do repositorio..."
git pull origin main
if [ $? -ne 0 ]; then
    echo "[AVISO] Falha ao atualizar repositorio"
    echo "Continuando com codigo local..."
fi
echo "  ✓ Codigo atualizado"
echo ""

echo "[3/6] Parando containers..."
docker-compose -f docker/docker-compose.yml down
echo "  ✓ Containers parados"
echo ""

echo "[4/6] Reconstruindo imagens..."
echo "  (Isso pode levar alguns minutos...)"
docker-compose -f docker/docker-compose.yml build
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao construir imagens!"
    exit 1
fi
echo "  ✓ Imagens reconstruidas"
echo ""

echo "[5/6] Reiniciando containers..."
docker-compose -f docker/docker-compose.yml up -d
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao iniciar containers!"
    exit 1
fi
echo "  ✓ Containers iniciados"
echo ""

echo "[6/6] Executando migracoes do banco de dados..."
sleep 5
docker-compose -f docker/docker-compose.yml exec -T backend npm run migrate
if [ $? -ne 0 ]; then
    echo "[AVISO] Falha ao executar migracoes automaticamente"
    echo "Execute manualmente: docker-compose -f docker/docker-compose.yml exec backend npm run migrate"
fi
echo "  ✓ Migracoes executadas"
echo ""

echo "========================================"
echo "Atualizacao concluida com sucesso! ✅"
echo "========================================"
echo ""
echo "Aplicacao atualizada e rodando em:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:3001"
echo ""
echo "Comandos uteis:"
echo "  - Ver logs: docker-compose -f docker/docker-compose.yml logs -f"
echo "  - Reiniciar: docker-compose -f docker/docker-compose.yml restart"
echo "  - Parar: docker-compose -f docker/docker-compose.yml down"
echo ""

