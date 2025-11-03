#!/bin/bash
# OpenSilicio - Deploy em Producao (Linux/Mac)
# Este script faz o deploy completo da aplicacao em producao

set -e

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

echo "[1/7] Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "[ERRO] Arquivo .env nao encontrado!"
    echo ""
    echo "Por favor, copie o arquivo .env.example para .env e configure:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    echo "IMPORTANTE: Configure pelo menos:"
    echo "  - POSTGRES_PASSWORD (senha forte)"
    echo "  - JWT_SECRET (string aleatoria de pelo menos 32 caracteres)"
    echo "  - VITE_API_URL (URL da API em producao, ex: https://seu-dominio.com/api)"
    echo "  - CORS_ORIGINS (origens permitidas separadas por virgula)"
    echo "  - POSTGRES_DB (opcional, padrao: opensilicio_prod)"
    echo "  - POSTGRES_USER (opcional, padrao: opensilicio)"
    echo ""
    echo "NOTA: DATABASE_URL sera construido automaticamente pelo docker-compose"
    echo ""
    exit 1
fi
echo "  ✓ Arquivo .env encontrado"

# Carregar variaveis do .env
export $(grep -v '^#' .env | xargs)

echo "[2/7] Validando variaveis de ambiente..."
MISSING_VARS=0

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "[AVISO] POSTGRES_PASSWORD nao definido no .env"
    MISSING_VARS=1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "[AVISO] JWT_SECRET nao definido no .env"
    MISSING_VARS=1
fi

if [ -z "$VITE_API_URL" ]; then
    echo "[AVISO] VITE_API_URL nao definido no .env"
    MISSING_VARS=1
fi

if [ $MISSING_VARS -eq 1 ]; then
    echo "[ERRO] Variaveis essenciais faltando no .env!"
    echo "Por favor, verifique o arquivo .env.example e configure todas as variaveis necessarias."
    exit 1
fi
echo "  ✓ Variaveis validadas"
echo ""

echo "[3/7] Parando containers existentes..."
docker-compose -f docker/docker-compose.prod.yml down
echo "  ✓ Containers parados"
echo ""

echo "[4/7] Construindo imagens de producao..."
echo "  (Isso pode levar alguns minutos...)"
docker-compose -f docker/docker-compose.prod.yml build --no-cache
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao construir imagens!"
    exit 1
fi
echo "  ✓ Imagens construidas"
echo ""

echo "[5/7] Iniciando containers em producao..."
docker-compose -f docker/docker-compose.prod.yml up -d
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao iniciar containers!"
    exit 1
fi
echo "  ✓ Containers iniciados"
echo ""

echo "[6/7] Aguardando banco de dados inicializar..."
sleep 15
echo "  ✓ Banco de dados pronto"
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

# Perguntar sobre seed de admin
echo "Deseja criar o usuario administrador padrao?"
echo "  Username: AdmOpen"
echo "  Password: ADMOpenSilicio123!@2025"
read -p "Criar usuario admin? (S/N): " CREATE_ADMIN
if [ "$CREATE_ADMIN" = "S" ] || [ "$CREATE_ADMIN" = "s" ]; then
    echo "Criando usuario administrador..."
    docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run seed:admin
    if [ $? -ne 0 ]; then
        echo "[AVISO] Falha ao criar usuario admin automaticamente"
    fi
fi

# Perguntar sobre seed de settings
echo ""
echo "Deseja inserir configuracoes iniciais do site?"
read -p "Inserir configuracoes? (S/N): " SEED_SETTINGS
if [ "$SEED_SETTINGS" = "S" ] || [ "$SEED_SETTINGS" = "s" ]; then
    echo "Inserindo configuracoes iniciais..."
    docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run seed:settings
    if [ $? -ne 0 ]; then
        echo "[AVISO] Falha ao inserir configuracoes automaticamente"
    fi
fi

echo ""
echo "========================================"
echo "Deploy concluido com sucesso! 🚀"
echo "========================================"
echo ""
echo "Aplicacao rodando em:"
echo "  - Frontend: http://localhost:80"
echo "  - Backend:  http://localhost:3001"
echo ""
echo "Comandos uteis:"
echo "  - Ver logs: docker-compose -f docker/docker-compose.prod.yml logs -f"
echo "  - Criar admin: docker-compose -f docker/docker-compose.prod.yml exec backend npm run seed:admin"
echo "  - Parar: docker-compose -f docker/docker-compose.prod.yml down"
echo ""
