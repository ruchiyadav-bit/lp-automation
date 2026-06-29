@echo off
REM ============================================================
REM  LandingPageSaaS - start backend + frontend together.
REM  Double-click this file any time to run both servers.
REM  Two terminal windows open; close them to stop the servers.
REM ============================================================

echo Starting LandingPageSaaS...
echo.

REM %~dp0 = the folder this .bat lives in (the project root)
start "LandingPageSaaS Backend"  cmd /k "cd /d %~dp0backend && npm run dev"
start "LandingPageSaaS Frontend" cmd /k "cd /d %~dp0frontend && npm start"

echo.
echo Backend  -> http://localhost:5000
echo Frontend -> http://localhost:3000  (opens automatically)
echo.
echo Two windows have opened. Close them to stop the servers.
timeout /t 4 >nul
