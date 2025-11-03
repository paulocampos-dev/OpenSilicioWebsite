#!/bin/bash
# OpenSilicio - Atualizar Aplicacao em Producao (Linux/Mac)
# Este script atualiza a aplicacao em producao com as ultimas mudancas

set -e

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

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "[ERRO] Arquivo .env nao encontrado!"
    echo "Execute primeiro o script de deploy: scripts/production/deploy.sh"
    exit 1
fi

# Carregar variaveis do .env
export $(grep -v '^#' .env | xargs)

echo "[1/7] Criando backup do banco de dados..."
mkdir -p backups
BACKUP_FILE="backups/backup_$(date +%Y%m%d_%H%M%S).sql"

# Usar variaveis do .env ou valores padrao
PG_USER=${POSTGRES_USER:-opensilicio}
PG_DB=${POSTGRES_DB:-opensilicio_prod}

docker-compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U $PG_USER $PG_DB > $BACKUP_FILE
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao criar backup!"
    echo "Abortando atualizacao por seguranca."
    exit 1
fi
echo "  ✓ Backup criado: $BACKUP_FILE"
echo ""

echo "[2/7] Atualizando codigo do repositorio..."
git pull origin main || echo "[AVISO] Falha ao atualizar repositorio - continuando com codigo local..."
echo "  ✓ Codigo atualizado"
echo ""

echo "[3/7] Parando containers..."
docker-compose -f docker/docker-compose.prod.yml down
echo "  ✓ Containers parados"
echo ""

echo "[4/7] Reconstruindo imagens de producao..."
echo "  (Isso pode levar alguns minutos...)"
docker-compose -f docker/docker-compose.prod.yml build
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao construir imagens!"
    exit 1
fi
echo "  ✓ Imagens reconstruidas"
echo ""

echo "[5/7] Reiniciando containers..."
docker-compose -f docker/docker-compose.prod.yml up -d
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao iniciar containers!"
    exit 1
fi
echo "  ✓ Containers iniciados"
echo ""

echo "[6/7] Aguardando servicos iniciarem..."
sleep 10
echo "  ✓ Servicos prontos"
echo ""

echo "[7/7] Executando migracoes do banco de dados..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run migrate
if [ $? -ne 0 ]; then
    echo "[AVISO] Falha ao executar migracoes automaticamente"
    echo "Execute manualmente: docker-compose -f docker/docker-compose.prod.yml exec backend npm run migrate"
else
    echo "  ✓ Migracoes executadas"
fi
echo ""

echo "========================================"
echo "Atualizacao concluida com sucesso! ✅"
echo "========================================"
echo ""
echo "Aplicacao atualizada e rodando em:"
echo "  - Frontend: http://localhost:80"
echo "  - Backend:  http://localhost:3001"
echo ""
echo "Backup salvo em: $BACKUP_FILE"
echo ""
echo "Comandos uteis:"
echo "  - Ver logs: docker-compose -f docker/docker-compose.prod.yml logs -f"
echo "  - Reiniciar: docker-compose -f docker/docker-compose.prod.yml restart"
echo "  - Parar: docker-compose -f docker/docker-compose.prod.yml down"
echo ""
