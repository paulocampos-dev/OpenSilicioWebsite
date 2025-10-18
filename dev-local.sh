#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "========================================"
echo "   OpenSilicio - Development Mode"
echo "========================================"
echo ""

# Check if Docker is running
echo -e "${BLUE}Checking Docker...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Docker is not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}Docker is running${NC}"
echo ""

# Check for restart argument
RESTART_MODE=0
if [ "$1" == "restart" ] || [ "$1" == "-r" ] || [ "$1" == "--restart" ]; then
    RESTART_MODE=1
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Kill existing processes if restarting
if [ $RESTART_MODE -eq 1 ]; then
    echo -e "${YELLOW}Restarting services...${NC}"
    echo "Stopping existing processes..."
    
    # Kill backend processes (ts-node-dev)
    pkill -f "ts-node-dev" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true
    
    # Stop database container
    docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
    
    sleep 2
    echo -e "${GREEN}Processes stopped${NC}"
    echo ""
fi

# Start or restart database
echo -e "${BLUE}Starting PostgreSQL database...${NC}"
docker-compose -f docker-compose.dev.yml down > /dev/null 2>&1
docker-compose -f docker-compose.dev.yml up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to start database${NC}"
    exit 1
fi

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 8

# Check database health
docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U admin -d opensilicio > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}WARNING: Database may not be ready yet. Continuing anyway...${NC}"
else
    echo -e "${GREEN}Database is ready${NC}"
fi
echo ""

# Check if node_modules exist in backend
if [ ! -d "backend/node_modules" ]; then
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd backend
    npm install
    cd ..
    echo ""
fi

# Check if node_modules exist in frontend
if [ ! -d "openSilicioWebsite/node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd openSilicioWebsite
    npm install
    cd ..
    echo ""
fi

# Export environment variables for backend
export DATABASE_URL="postgresql://admin:admin123@localhost:5432/opensilicio"
export JWT_SECRET="8f3c4e2d9a7b6e1f5c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3"
export PORT="3001"
export API_URL="http://localhost:3001"
export NODE_ENV="development"
export CORS_ORIGINS="http://localhost:5173"

# Start backend in background with logging
echo -e "${BLUE}Starting Backend API...${NC}"
cd backend
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo -e "${BLUE}Starting Frontend...${NC}"
cd openSilicioWebsite
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Save PIDs for later reference
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# Wait for services to be ready
echo ""
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 5

# Run database migrations/seeds
echo ""
echo -e "${BLUE}Running database setup...${NC}"

# Wait a bit more for backend to be fully ready
sleep 3

echo -e "${YELLOW}Creating admin user...${NC}"
cd backend
npx ts-node src/scripts/seedAdmin.ts 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Note: Admin user may already exist${NC}"
else
    echo -e "${GREEN}Admin user created${NC}"
fi

echo -e "${YELLOW}Migrating data...${NC}"
npx ts-node src/scripts/migrateData.ts 2>/dev/null
cd ..

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   OpenSilicio is now running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Services:${NC}"
echo "  - Backend API:  http://localhost:3001"
echo "  - Frontend:     http://localhost:5173"
echo "  - Database:     localhost:5432"
echo ""
echo -e "${BLUE}Logs:${NC}"
echo "  - Backend logs:  tail -f logs/backend.log"
echo "  - Frontend logs: tail -f logs/frontend.log"
echo ""
echo -e "${BLUE}Admin Credentials:${NC}"
echo "  - Username: AdmOpen"
echo "  - Password: Test123"
echo ""
echo -e "${BLUE}Process IDs:${NC}"
echo "  - Backend PID:  $BACKEND_PID"
echo "  - Frontend PID: $FRONTEND_PID"
echo ""
echo -e "${YELLOW}Commands:${NC}"
echo "  - Restart all:     ./dev-local.sh restart"
echo "  - Stop all:        ./stop-dev.sh"
echo "  - Stop database:   docker-compose -f docker-compose.dev.yml down"
echo "  - View backend:    tail -f logs/backend.log"
echo "  - View frontend:   tail -f logs/frontend.log"
echo ""

# Open browser (if available)
if command -v open &> /dev/null; then
    sleep 2
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open http://localhost:5173
fi

echo -e "${GREEN}Development server is running in the background.${NC}"
echo -e "${YELLOW}Use './stop-dev.sh' to stop all services.${NC}"
echo ""

