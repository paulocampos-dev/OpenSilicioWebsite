#!/bin/bash

echo "🚀 Iniciando OpenSilício em modo desenvolvimento com Hot Reload..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker Desktop."
    exit 1
fi

echo "✅ Docker está rodando"

# Parar containers antigos se existirem
echo "🔄 Parando containers antigos..."
docker-compose -f ../../docker/docker-compose.dev.yml down -v

# Iniciar containers
echo "🏗️  Construindo e iniciando containers..."
docker-compose -f ../../docker/docker-compose.dev.yml up --build -d

# Aguardar o PostgreSQL estar pronto
echo "⏳ Aguardando PostgreSQL estar pronto..."
sleep 10

# Executar migrações
echo "🔄 Executando migrações do banco de dados..."
docker-compose -f ../../docker/docker-compose.dev.yml exec -T backend npm run migrate

# Executar seed do admin
echo "👤 Criando usuário administrador..."
docker-compose -f ../../docker/docker-compose.dev.yml exec -T backend npx ts-node src/scripts/seedAdmin.ts

# Executar seed de configurações
echo "⚙️  Inserindo configurações iniciais..."
docker-compose -f ../../docker/docker-compose.dev.yml exec -T backend npx ts-node src/scripts/seedSettings.ts

# Executar migração de dados
echo "📊 Migrando dados existentes..."
docker-compose -f ../../docker/docker-compose.dev.yml exec -T backend npx ts-node src/scripts/migrateData.ts

# Testar conectividade do backend
echo "🔍 Testando conectividade do backend..."
sleep 5
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Backend está respondendo corretamente"
else
    echo "⚠️  Backend pode não estar pronto ainda. Aguarde alguns segundos."
fi

echo ""
echo "✅ OpenSilício está rodando com Hot Reload!"
echo ""
echo "📡 Backend API: http://localhost:3001"
echo "🌐 Frontend: http://localhost:5173"
echo "🗄️  PostgreSQL: localhost:5432"
echo ""
echo "👤 Usuário Admin:"
echo "   Username: AdmOpen"
echo "   Password: ADMOpenSilicio123!@2025"
echo ""
echo "🔥 Hot Reload ATIVADO:"
echo "   - Backend: Edite arquivos em backend/src/ (~2s reload)"
echo "   - Frontend: Edite arquivos em openSilicioWebsite/src/ (instantâneo)"
echo ""
echo "Para ver logs: docker-compose -f ../../docker/docker-compose.dev.yml logs -f"
echo "Para parar: docker-compose -f ../../docker/docker-compose.dev.yml down"
echo ""

# Abrir navegador (funciona no Mac/Linux)
if command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
fi

