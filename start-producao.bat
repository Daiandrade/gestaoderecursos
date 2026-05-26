@echo off
REM ==============================================
REM Sistema de Gestao de Recursos - Thomson Reuters
REM Inicializacao em Producao
REM ==============================================

cd /d "%~dp0backend"

echo.
echo ============================================================
echo  Iniciando Sistema de Gestao de Recursos - Producao
echo ============================================================
echo.

REM Verifica se Node.js esta instalado
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado. Instale Node.js 16+ primeiro.
    pause
    exit /b 1
)

REM Verifica se as dependencias estao instaladas
if not exist node_modules (
    echo Instalando dependencias do backend...
    call npm install --production
)

REM Verifica se o banco existe, se nao, inicializa
if not exist database.sqlite (
    echo Inicializando banco de dados...
    call npm run init-db
)

REM Verifica se o build do frontend existe
if not exist "..\frontend\build\index.html" (
    echo [ERRO] Build do frontend nao encontrado.
    echo Execute primeiro: build-producao.bat
    pause
    exit /b 1
)

REM Define ambiente de producao
set NODE_ENV=production

echo Iniciando servidor...
echo.
echo Acesse: http://localhost:5000
echo Pressione Ctrl+C para parar o servidor
echo.

node src\server.js

pause
