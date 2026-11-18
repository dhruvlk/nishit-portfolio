@echo off
title Cinematic Portfolio - dev server
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is not installed. Get the LTS version from https://nodejs.org then run this again. & pause & exit /b 1)
if not exist "node_modules\next" (
  echo Installing dependencies - first run takes a few minutes...
  call npm install || (echo npm install failed. & pause & exit /b 1)
)
echo Starting the site at http://localhost:3000 ...
start "" cmd /c "timeout /t 12 >nul & start http://localhost:3000"
call npm run dev
pause
