#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}Stopping OpenSilicio development services...${NC}"
echo ""

# Kill processes using saved PIDs
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null || true
    fi
    rm -f logs/backend.pid
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}Stopping frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    rm -f logs/frontend.pid
fi

# Fallback: kill by process name
echo -e "${YELLOW}Cleaning up any remaining processes...${NC}"
pkill -f "ts-node-dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

# Stop database container
echo -e "${YELLOW}Stopping database container...${NC}"
docker-compose -f ../../docker/docker-compose.dev.yml down > /dev/null 2>&1

sleep 2

echo ""
echo -e "${GREEN}All services stopped successfully!${NC}"
echo ""

