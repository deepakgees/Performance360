@echo off
REM Debug script for Performance360 (Windows)
REM This script starts both frontend and backend in debug mode

echo 🚀 Starting Performance360 in Debug Mode...
echo.

REM Start backend in debug mode
echo 🔧 Starting Backend in debug mode (port 3001)...
cd backend
start "Backend Debug" cmd /k "npm run debug"
cd ..

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in debug mode
echo 🎨 Starting Frontend in debug mode (port 3000)...
cd frontend
start "Frontend Debug" cmd /k "npm run debug"
cd ..

echo.
echo ✅ Debug servers started!
echo 📊 Backend: http://localhost:3001 (Debug port: 9229)
echo 🎨 Frontend: http://localhost:3000
echo.
echo 🔍 To debug:
echo    - Backend: Open Chrome DevTools and go to chrome://inspect
echo    - Frontend: Use browser DevTools or VS Code debugger
echo.
echo Press any key to exit...
pause >nul 