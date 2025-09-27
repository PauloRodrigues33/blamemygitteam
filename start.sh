#!/bin/bash

# Script para iniciar o projeto Blame My Git Team
# Autor: Assistente AI
# Data: $(date)

echo "🚀 Iniciando Blame My Git Team..."
echo "=================================="

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js primeiro."
    echo "   Visite: https://nodejs.org/"
    exit 1
fi

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não está instalado. Por favor, instale o npm primeiro."
    exit 1
fi

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Arquivo package.json não encontrado."
    echo "   Certifique-se de estar no diretório raiz do projeto."
    exit 1
fi

# Verificar se as dependências estão instaladas
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Erro ao instalar dependências."
        exit 1
    fi
fi

# Verificar se o banco de dados existe
if [ ! -f "data/app.db" ]; then
    echo "📊 Criando diretório de dados..."
    mkdir -p data
fi

echo "✅ Tudo pronto!"
echo "🌐 Iniciando servidor de desenvolvimento..."
echo "   URL: http://localhost:3010"
echo "   Pressione Ctrl+C para parar o servidor"
echo ""

# Iniciar o servidor de desenvolvimento
npm run dev