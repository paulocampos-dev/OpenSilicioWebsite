@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo   OpenSilicio - Development Mode
echo ========================================
echo.

REM Color codes for Windows (using findstr workaround)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "RESET=[0m"

REM Check if Docker is running
echo %BLUE%Checking Docker...%RESET%
docker info >nul 2>&1
if errorlevel 1 (
    echo %RED%ERROR: Docker is not running. Please start Docker Desktop.%RESET%
    pause
    exit /b 1
)
echo %GREEN%Docker is running%RESET%
echo.

REM Check for restart argument
set "RESTART_MODE=0"
if "%1"=="restart" set "RESTART_MODE=1"
if "%1"=="-r" set "RESTART_MODE=1"
if "%1"=="--restart" set "RESTART_MODE=1"

REM Create logs directory if it doesn't exist
if not exist "logs" mkdir logs

REM Kill existing processes if restarting
if %RESTART_MODE%==1 (
    echo %YELLOW%Restarting services...%RESET%
    echo Stopping existing processes...
    
    REM Kill backend processes
    for /f "tokens=2" %%a in ('tasklist ^| findstr "node.exe"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    
    REM Stop database container
    docker-compose -f docker-compose.dev.yml down >nul 2>&1
    
    timeout /t 2 /nobreak >nul
    echo %GREEN%Processes stopped%RESET%
    echo.
)

REM Start or restart database
echo %BLUE%Starting PostgreSQL database...%RESET%
docker-compose -f docker-compose.dev.yml down >nul 2>&1
docker-compose -f docker-compose.dev.yml up -d

if errorlevel 1 (
    echo %RED%ERROR: Failed to start database%RESET%
    pause
    exit /b 1
)

REM Wait for database to be ready
echo %YELLOW%Waiting for database to be ready...%RESET%
timeout /t 8 /nobreak >nul

REM Check database health
docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U admin -d opensilicio >nul 2>&1
if errorlevel 1 (
    echo %YELLOW%WARNING: Database may not be ready yet. Continuing anyway...%RESET%
) else (
    echo %GREEN%Database is ready%RESET%
)
echo.

REM Check if node_modules exist in backend
if not exist "backend\node_modules" (
    echo %BLUE%Installing backend dependencies...%RESET%
    cd backend
    call npm install
    cd ..
    echo.
)

REM Check if node_modules exist in frontend
if not exist "openSilicioWebsite\node_modules" (
    echo %BLUE%Installing frontend dependencies...%RESET%
    cd openSilicioWebsite
    call npm install
    cd ..
    echo.
)

REM Set environment variables for backend
set "DATABASE_URL=postgresql://admin:admin123@localhost:5432/opensilicio"
set "JWT_SECRET=8f3c4e2d9a7b6e1f5c8d9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3"
set "PORT=3001"
set "API_URL=http://localhost:3001"
set "NODE_ENV=development"
set "CORS_ORIGINS=http://localhost:5173"

REM Start backend in background with logging
echo %BLUE%Starting Backend API...%RESET%
cd backend
start "OpenSilicio Backend" cmd /c "npm run dev 2>&1 | tee ..\logs\backend.log"
cd ..

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in background
echo %BLUE%Starting Frontend...%RESET%
cd openSilicioWebsite
start "OpenSilicio Frontend" cmd /c "npm run dev"
cd ..

REM Wait for services to be ready
echo.
echo %YELLOW%Waiting for services to start...%RESET%
timeout /t 5 /nobreak >nul

REM Run database migrations/seeds
echo.
echo %BLUE%Running database setup...%RESET%

REM Wait a bit more for backend to be fully ready
timeout /t 3 /nobreak >nul

echo %YELLOW%Creating admin user...%RESET%
cd backend
npx ts-node src/scripts/seedAdmin.ts 2>nul
if errorlevel 1 (
    echo %YELLOW%Note: Admin user may already exist%RESET%
) else (
    echo %GREEN%Admin user created%RESET%
)

echo %YELLOW%Migrating data...%RESET%
npx ts-node src/scripts/migrateData.ts 2>nul
cd ..

echo.
echo %GREEN%========================================%RESET%
echo %GREEN%   OpenSilicio is now running!%RESET%
echo %GREEN%========================================%RESET%
echo.
echo %BLUE%Services:%RESET%
echo   - Backend API:  http://localhost:3001
echo   - Frontend:     http://localhost:5173
echo   - Database:     localhost:5432
echo.
echo %BLUE%Logs:%RESET%
echo   - Backend logs: logs\backend.log
echo.
echo %BLUE%Admin Credentials:%RESET%
echo   - Username: AdmOpen
echo   - Password: Test123
echo.
echo %YELLOW%Commands:%RESET%
echo   - Restart all:     dev-local.bat restart
echo   - Stop database:   docker-compose -f docker-compose.dev.yml down
echo   - View logs:       type logs\backend.log
echo   - Stop services:   Close the terminal windows or Ctrl+C
echo.

REM Open browser
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo %GREEN%Press any key to view backend logs, or close this window.%RESET%
pause >nul

REM Show backend logs
type logs\backend.log

