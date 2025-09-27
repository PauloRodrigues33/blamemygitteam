@echo off
title Blame My Git Team - Servidor de Desenvolvimento

echo 🚀 Iniciando Blame My Git Team...
echo ==================================

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não está instalado. Por favor, instale o Node.js primeiro.
    echo    Visite: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se o npm está instalado
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não está instalado. Por favor, instale o npm primeiro.
    pause
    exit /b 1
)

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ❌ Arquivo package.json não encontrado.
    echo    Certifique-se de estar no diretório raiz do projeto.
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências.
        pause
        exit /b 1
    )
)

REM Verificar se o banco de dados existe
if not exist "data" (
    echo 📊 Criando diretório de dados...
    mkdir data
)

echo ✅ Tudo pronto!
echo 🌐 Iniciando servidor de desenvolvimento...
echo    URL: http://localhost:3010
echo    Pressione Ctrl+C para parar o servidor
echo.

REM Iniciar o servidor de desenvolvimento
npm run dev

pause