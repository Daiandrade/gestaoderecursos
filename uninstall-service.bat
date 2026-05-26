@echo off
REM Desinstalacao do Servico Windows
REM Execute como ADMINISTRADOR

cd /d "%~dp0service"

net session >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Execute como ADMINISTRADOR
    pause
    exit /b 1
)

echo Desinstalando servico TR-GestaoRecursos...
node uninstall-service.js
echo.
pause
