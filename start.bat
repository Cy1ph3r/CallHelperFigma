@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
cls

REM ============================================================
REM Rafeeq Call Helper - Windows Startup Script
REM - Starts MongoDB (service if installed)
REM - Creates default .env files if missing
REM - Seeds DB once (creates backend\.seeded marker)
REM - Starts backend + frontend in separate windows
REM ============================================================

echo.
echo =============================================
echo   رفيق - مساعد المكالمات الذكي
echo   Rafeeq Call Helper - Windows Start
echo =============================================
echo.

REM --- Ensure backend .env exists (copy from example if missing)
if not exist "backend\.env" (
  if exist "backend\.env.example" (
    echo [INFO] backend\.env not found. Creating from backend\.env.example
    copy /Y "backend\.env.example" "backend\.env" >nul
  ) else (
    echo [WARN] backend\.env.example not found. Creating minimal backend\.env
    > "backend\.env" echo PORT=5000
    >>"backend\.env" echo NODE_ENV=development
    >>"backend\.env" echo FRONTEND_URL=http://localhost:3000
    >>"backend\.env" echo MONGODB_URI=mongodb://localhost:27017/rafeeq_db
    >>"backend\.env" echo JWT_SECRET=rafeeq-dev-secret
    >>"backend\.env" echo JWT_EXPIRE=7d
  )
)

REM --- Ensure frontend .env exists (optional)
if not exist ".env" (
  echo [INFO] .env not found. Creating .env with VITE_ENABLE_AI=false
  > ".env" echo VITE_ENABLE_AI=false
)

REM --- Try to start MongoDB Windows service (common service names)
call :startMongoService "MongoDB"
call :startMongoService "MongoDB Server"
call :startMongoService "MongoDBServer"

REM --- Install dependencies (if node_modules missing)
if not exist "node_modules" (
  echo [INFO] Installing frontend dependencies
  call npm install
  if errorlevel 1 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
  )
)

if not exist "backend\node_modules" (
  echo [INFO] Installing backend dependencies
  pushd backend
  call npm install
  popd
  if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
  )
)

REM --- Seed database once (WARNING: seed wipes Users/KnowledgeBase)
if not exist "backend\.seeded" (
  echo [INFO] Seeding database - first run only
  pushd backend
  call npm run seed
  popd
  if errorlevel 1 (
    echo [ERROR] Seeding failed. Check MongoDB is running and backend\.env MONGODB_URI is correct.
    pause
    exit /b 1
  )
  echo seeded>"backend\.seeded"
)

REM --- Start backend + frontend in separate terminals
start "Rafeeq Backend" cmd /k "cd /d %cd%\backend && npm run dev"
start "Rafeeq Frontend" cmd /k "cd /d %cd% && npm run dev"

echo.
echo [DONE] Started backend and frontend.
echo - Frontend: http://localhost:3000
echo - Backend:  http://localhost:5000

echo.
echo Login:
echo - admin / admin123
echo - user  / user123

echo.
echo Notes:
echo - If MongoDB service didn^&t start, start it manually or verify the service name.
echo - backend\utils\seed.js wipes Users and KnowledgeBase when run.
echo.

exit /b 0

:startMongoService
set "SVC=%~1"
sc query "%SVC%" >nul 2>&1
if %errorlevel% neq 0 (
  goto :eof
)

for /f "tokens=3 delims=: " %%A in ('sc query "%SVC%" ^| findstr /i "STATE"') do set "STATE=%%A"
if /i "%STATE%"=="RUNNING" (
  echo [INFO] MongoDB service "%SVC%" already running.
  goto :eof
)

echo [INFO] Starting MongoDB service "%SVC%"...
net start "%SVC%" >nul 2>&1
if %errorlevel% neq 0 (
  echo [WARN] Failed to start service "%SVC%". Try running this script as Administrator.
) else (
  echo [OK] MongoDB service "%SVC%" started.
)

goto :eof
