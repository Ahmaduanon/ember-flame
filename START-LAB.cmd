@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Install Node.js 22.13 or newer from https://nodejs.org/ and try again.
  pause
  exit /b 1
)
if not exist runtime\server.js (
  echo First run: installing and building. This needs internet and takes about a minute.
  call npm install
  if errorlevel 1 ( pause & exit /b 1 )
  call npm run build
  if errorlevel 1 ( pause & exit /b 1 )
)
node runtime/server.js
pause
