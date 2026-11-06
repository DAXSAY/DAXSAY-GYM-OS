@echo off
title RADICAL
cd /d "%~dp0"
echo ============================================
echo   RADICAL - iniciando el sistema...
echo   (se abre solo en el navegador; para apagarlo cierra esta ventana)
echo ============================================
if not exist node_modules (
  echo Instalando dependencias por primera vez...
  call npm install
)
call npm run dev
pause
