@echo off
echo.
echo Stopping OpenSilicio development services...
echo.

REM Kill all node.exe processes (this will stop both backend and frontend)
echo Stopping backend and frontend...
taskkill /F /IM node.exe >nul 2>&1

REM Stop database container
echo Stopping database container...
docker-compose -f ../../docker/docker-compose.dev.yml down >nul 2>&1

timeout /t 2 /nobreak >nul

echo.
echo All services stopped successfully!
echo.
pause

