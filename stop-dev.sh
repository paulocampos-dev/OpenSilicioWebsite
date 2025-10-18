#!/bin/bash
echo "🛑 Parando OpenSilicio..."
docker-compose -f docker/docker-compose.dev.yml down
echo "✅ Serviços parados!"

