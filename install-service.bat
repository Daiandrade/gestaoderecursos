@echo off
REM ==============================================
REM Instalacao do Servico Windows
REM Sistema de Gestao de Recursos - TR
REM ==============================================
REM
REM IMPORTANTE: Execute este arquivo como ADMINISTRADOR
REM Clique direito -> Executar como administrador
REM ==============================================

cd /d "%~dp0service"

REM Verifica se esta rodando como admin
net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERRO] Este script precisa ser executado como ADMINISTRADOR
    echo.
    echo Clique com botao direito neste arquivo e selecione:
    echo "Executar como administrador"
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Instalando como Servico Windows
echo ============================================================
echo.

REM Verifica se o build existe
if not exist "..\frontend\build\index.html" (
    echo [ERRO] Build do frontend nao encontrado.
    echo Execute primeiro: build-producao.bat
    pause
    exit /b 1
)

REM Instala dependencias do node-windows se necessario
if not exist node_modules (
    echo Instalando node-windows...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERRO] Falha ao instalar node-windows
        pause
        exit /b 1
    )
)

echo.
echo Instalando servico TR-GestaoRecursos...
node install-service.js

echo.
echo ============================================================
echo Apos instalacao:
echo   - Servico inicia automaticamente com o Windows
echo   - Para gerenciar: services.msc (procurar "TR-GestaoRecursos")
echo   - Acesse: http://localhost:5000
echo ============================================================
echo.
pause
