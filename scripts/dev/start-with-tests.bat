@echo off
echo ========================================
echo OpenSilicio - Iniciar com Testes
echo ========================================
echo.

REM Executar o script de start normal
call "%~dp0start.bat"

echo.
echo ========================================
echo Executando Testes de Integracao
echo ========================================
echo.

REM Aguardar um pouco mais para garantir que tudo está estável
echo ⏳ Aguardando ambiente estabilizar (5 segundos)...
timeout /t 5 /nobreak >nul

REM Executar testes de integração
echo 🧪 Rodando testes de integração...
echo.

docker-compose -f docker\docker-compose.dev.yml exec -T backend npm run test:integration

if errorlevel 1 (
    echo.
    echo ❌ Alguns testes FALHARAM!
    echo    Verifique os erros acima.
    echo.
) else (
    echo.
    echo ✅ Todos os testes PASSARAM!
    echo.
)

echo ========================================
echo Resumo
echo ========================================
echo.
echo ✅ Ambiente de desenvolvimento rodando
echo 🧪 Testes de integração executados
echo.
echo 📡 Backend API: http://localhost:3001
echo 🌐 Frontend: http://localhost:5173
echo.
echo Para rodar testes novamente: 
echo   docker-compose -f docker\docker-compose.dev.yml exec backend npm test
echo.
echo Para ver logs: 
echo   docker-compose -f docker\docker-compose.dev.yml logs -f
echo.
echo Para parar: 
echo   docker-compose -f docker\docker-compose.dev.yml down
echo.

pause

