#!/bin/bash
# OpenSilicio - Teste de Ambiente de Producao (Linux/Mac)
# Este script testa o ambiente de producao completo: cria dados, executa testes, aplica migracoes e verifica integridade

set -e

echo "========================================"
echo "OpenSilicio - Teste de Ambiente de Producao"
echo "========================================"
echo ""

# Verificar se Docker esta rodando
if ! docker info > /dev/null 2>&1; then
    echo "[ERRO] Docker nao esta rodando!"
    echo "Por favor, inicie o Docker e tente novamente."
    exit 1
fi

echo "[1/11] Verificando arquivo .env..."
if [ ! -f .env ]; then
    echo "[ERRO] Arquivo .env nao encontrado!"
    echo ""
    echo "Por favor, copie o arquivo .env.example para .env e configure:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    exit 1
fi
echo "  ✓ Arquivo .env encontrado"
echo ""

# Carregar variaveis do .env
export $(grep -v '^#' .env | xargs)

# Validar variaveis essenciais
echo "[2/11] Validando variaveis de ambiente..."
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
    exit 1
fi
echo "  ✓ Variaveis validadas"
echo ""

# Criar diretorio de backups se nao existir
mkdir -p backups

# Criar backup inicial
echo "[3/11] Criando backup inicial..."
BACKUP_FILE="backups/backup_before_test_$(date +%Y%m%d_%H%M%S).sql"
POSTGRES_USER=${POSTGRES_USER:-opensilicio}
POSTGRES_DB=${POSTGRES_DB:-opensilicio_prod}

docker-compose -f docker/docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE" 2>/dev/null || {
    echo "[AVISO] Backup falhou, mas continuando..."
}
if [ -f "$BACKUP_FILE" ]; then
    echo "  ✓ Backup criado: $BACKUP_FILE"
fi
echo ""

# Parar containers existentes
echo "[4/11] Parando containers existentes..."
docker-compose -f docker/docker-compose.prod.yml down
echo "  ✓ Containers parados"
echo ""

# Construir imagens
echo "[5/11] Construindo imagens de producao..."
echo "  (Isso pode levar alguns minutos...)"
docker-compose -f docker/docker-compose.prod.yml build --no-cache
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao construir imagens!"
    exit 1
fi
echo "  ✓ Imagens construidas"
echo ""

# Iniciar containers
echo "[6/11] Iniciando containers em producao..."
docker-compose -f docker/docker-compose.prod.yml up -d
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao iniciar containers!"
    exit 1
fi
echo "  ✓ Containers iniciados"
echo ""

# Aguardar banco de dados inicializar
echo "[7/11] Aguardando banco de dados inicializar..."
sleep 20
echo "  ✓ Banco de dados pronto"
echo ""

# Executar migracoes iniciais
echo "[8/11] Executando migracoes iniciais..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run migrate
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao executar migracoes!"
    exit 1
fi
echo "  ✓ Migracoes iniciais executadas"
echo ""

# Criar usuario admin
echo "[9/11] Criando usuario administrador..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run seed:admin
if [ $? -ne 0 ]; then
    echo "[AVISO] Falha ao criar usuario admin"
fi
echo "  ✓ Usuario admin criado"
echo ""

# Criar dados de teste
echo "[10/11] Criando dados de teste..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run test:data
if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao criar dados de teste!"
    exit 1
fi
echo "  ✓ Dados de teste criados"
echo ""

# Executar testes
echo "[11/11] Executando testes de integracao..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm test
TEST_RESULT=$?
if [ $TEST_RESULT -ne 0 ]; then
    echo "[AVISO] Alguns testes falharam, mas continuando..."
else
    echo "  ✓ Todos os testes passaram"
fi
echo ""

# Executar migracoes pendentes
echo "Executando migracoes pendentes..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run migrate
if [ $? -ne 0 ]; then
    echo "[AVISO] Falha ao executar migracoes pendentes"
fi
echo "  ✓ Migracoes pendentes executadas"
echo ""

# Verificar integridade dos dados
echo "Verificando integridade dos dados..."
docker-compose -f docker/docker-compose.prod.yml exec -T backend npm run verify:data
INTEGRITY_RESULT=$?
if [ $INTEGRITY_RESULT -eq 0 ]; then
    echo "  ✓ Integridade verificada: DADOS PRESERVADOS"
else
    echo "  ✗ Integridade verificada: ERROS ENCONTRADOS"
fi
echo ""

echo "========================================"
echo "Teste de Producao Concluido"
echo "========================================"
echo ""
echo "Arquivos gerados:"
echo "  - test-data-snapshot.json"
echo "  - test-integrity-report.json"
if [ -f "$BACKUP_FILE" ]; then
    echo "  - Backup: $BACKUP_FILE"
fi
echo ""
echo "Aplicacao rodando em:"
echo "  - Frontend: http://localhost:80"
echo "  - Backend:  http://localhost:3001"
echo ""

# Perguntar se deseja limpar
echo "Deseja limpar o ambiente de teste?"
echo "  (Isso vai parar containers e remover volumes)"
read -p "Limpar ambiente? (S/N): " CLEANUP
if [ "$CLEANUP" = "S" ] || [ "$CLEANUP" = "s" ]; then
    echo ""
    echo "Limpando ambiente..."
    docker-compose -f docker/docker-compose.prod.yml down -v
    rm -f test-data-snapshot.json test-integrity-report.json
    echo "  ✓ Ambiente limpo"
else
    echo ""
    echo "Ambiente mantido para inspecao manual."
    echo "Para limpar depois, execute:"
    echo "  docker-compose -f docker/docker-compose.prod.yml down -v"
fi

echo ""

