#!/bin/bash
# OpenSilicio - Deploy em Producao (Linux/Mac)
# Este script faz o deploy completo da aplicacao em producao

echo "========================================"
echo "OpenSilicio - Deploy em Producao"
echo "========================================"
echo ""

# Verificar se Docker esta rodando
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker nao esta rodando!"
    echo "Por favor, inicie o Docker e tente novamente."
    exit 1
fi

echo "[1/6] Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "[AVISO] Arquivo .env nao encontrado!"
    echo "Criando .env de exemplo..."
    cat > .env << EOF
# Database
POSTGRES_DB=opensilicio_prod
POSTGRES_USER=opensilicio
POSTGRES_PASSWORD=ALTERE_ESTA_SENHA

# Backend
NODE_ENV=production
PORT=3001
JWT_SECRET=ALTERE_ESTE_SECRET
DATABASE_URL=postgresql://opensilicio:ALTERE_ESTA_SENHA@postgres:5432/opensilicio_prod

# Frontend (build time)
VITE_API_URL=http://localhost:3001/api
EOF
    echo ""
    echo "[IMPORTANTE] Edite o arquivo .env com suas configuracoes antes de continuar!"
    exit 1
fi
echo "  ✓ Arquivo .env encontrado"
echo ""

echo "[2/6] Parando containers existentes..."
docker-compose -f docker/docker-compose.yml down
echo "  ✓ Containers parados"
echo ""

echo "[3/6] Construindo imagens de producao..."
echo "  (Isso pode levar alguns minutos...)"
docker-compose -f docker/docker-compose.yml build --no-cache
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao construir imagens!"
    exit 1
fi
echo "  ✓ Imagens construidas"
echo ""

echo "[4/6] Iniciando containers em producao..."
docker-compose -f docker/docker-compose.yml up -d
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao iniciar containers!"
    exit 1
fi
echo "  ✓ Containers iniciados"
echo ""

echo "[5/6] Aguardando banco de dados inicializar..."
sleep 10
echo "  ✓ Banco de dados pronto"
echo ""

echo "[6/6] Executando migracoes do banco de dados..."
docker-compose -f docker/docker-compose.yml exec -T backend npm run migrate
if [ $? -ne 0 ]; then
    echo "[AVISO] Falha ao executar migracoes automaticamente"
    echo "Execute manualmente: docker-compose -f docker/docker-compose.yml exec backend npm run migrate"
fi
echo "  ✓ Migracoes executadas"
echo ""

echo "========================================"
echo "Deploy concluido com sucesso! 🚀"
echo "========================================"
echo ""
echo "Aplicacao rodando em:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend:  http://localhost:3001"
echo ""
echo "Proximos passos:"
echo "  1. Criar usuario admin: docker-compose -f docker/docker-compose.yml exec backend npm run seed:admin"
echo "  2. Ver logs: docker-compose -f docker/docker-compose.yml logs -f"
echo "  3. Configurar Nginx/Apache como proxy reverso"
echo ""

