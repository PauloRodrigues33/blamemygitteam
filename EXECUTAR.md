# Como Executar o Blame My Git Team

Este projeto possui scripts executáveis para facilitar o início do servidor de desenvolvimento.

## 📋 Pré-requisitos

- Node.js (versão 18 ou superior)
- npm (geralmente vem com o Node.js)

## 🚀 Formas de Executar

### 1. Script Completo (Recomendado)

#### No macOS/Linux:
```bash
# Dar permissão de execução (apenas na primeira vez)
chmod +x start.sh

# Executar o script
./start.sh
```

#### No Windows:
```cmd
# Executar o script
start.bat
```

### 2. Script Rápido (Para desenvolvimento)

#### No macOS/Linux:
```bash
# Dar permissão de execução (apenas na primeira vez)
chmod +x dev.sh

# Executar o script
./dev.sh
```

### 3. Comando Manual
```bash
npm run dev
```

## 🌐 Acesso

Após iniciar o servidor, acesse:
- **URL:** http://localhost:3010
- **Porta:** 3010

## 🛑 Parar o Servidor

Pressione `Ctrl+C` no terminal para parar o servidor.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento na porta 3010
- `npm run build` - Compila o projeto para produção
- `npm run start` - Inicia o servidor de produção na porta 3010
- `npm run lint` - Executa o linter

## 🔧 Solução de Problemas

### Erro: "command not found"
- Certifique-se de que o Node.js está instalado
- Verifique se o npm está no PATH do sistema

### Erro: "package.json not found"
- Certifique-se de estar no diretório raiz do projeto

### Erro de dependências
- Execute: `npm install`
- Se persistir, delete `node_modules` e execute `npm install` novamente

### Erro de porta em uso
- Se a porta 3010 estiver em uso, o Next.js tentará usar a próxima porta disponível
- Ou pare o processo que está usando a porta 3010

## 📞 Suporte

Se encontrar problemas, verifique:
1. Se o Node.js está instalado corretamente
2. Se está no diretório correto do projeto
3. Se as dependências foram instaladas
4. Se a porta 3010 está disponível

## 🔄 Mudanças Recentes

- **Porta alterada:** O projeto agora roda na porta 3010 (anteriormente 3000)
- **Scripts atualizados:** Todos os scripts foram atualizados para usar a nova porta