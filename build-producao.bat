@echo off
REM ==============================================
REM Build de Producao - Sistema de Gestao TR
REM Use este script sempre que atualizar o codigo
REM ==============================================

cd /d "%~dp0"

echo.
echo ============================================================
echo  Gerando Build de Producao
echo ============================================================
echo.

REM Verifica Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js nao encontrado.
    pause
    exit /b 1
)

echo [1/3] Instalando dependencias do backend...
cd backend
call npm install --production
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao instalar dependencias do backend
    pause
    exit /b 1
)

echo.
echo [2/3] Instalando dependencias do frontend...
cd ..\frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao instalar dependencias do frontend
    pause
    exit /b 1
)

echo.
echo [3/3] Gerando build otimizado do frontend...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao gerar build
    pause
    exit /b 1
)

cd ..

echo.
echo ============================================================
echo  Build concluido com sucesso!
echo ============================================================
echo.
echo Para iniciar em producao, execute: start-producao.bat
echo Para instalar como servico Windows, execute: install-service.bat (como Administrador)
echo.
pause
