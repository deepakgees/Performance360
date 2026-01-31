@echo on
echo Starting Performance360...

echo Starting Backend...
cd ../../backend
start /B npm run dev

echo %pwd%

echo Starting Frontend...
cd ../frontend
start /B npm start


echo Both applications are starting in the background.
echo Backend should be available at: http://localhost:3001
echo Frontend should be available at: http://localhost:3000
echo.
echo Press any key to exit this window...
pause >nul
