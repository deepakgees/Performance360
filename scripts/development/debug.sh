#!/bin/bash

# Debug script for Performance360
# This script starts both frontend and backend in debug mode

echo "🚀 Starting Performance360 in Debug Mode..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping debug servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend in debug mode
echo "🔧 Starting Backend in debug mode (port 3001)..."
cd backend
npm run debug &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend in debug mode
echo "🎨 Starting Frontend in debug mode (port 3000)..."
cd frontend
npm run debug &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Debug servers started!"
echo "📊 Backend: http://localhost:3001 (Debug port: 9229)"
echo "🎨 Frontend: http://localhost:3000"
echo ""
echo "🔍 To debug:"
echo "   - Backend: Open Chrome DevTools and go to chrome://inspect"
echo "   - Frontend: Use browser DevTools or VS Code debugger"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for background processes
wait 