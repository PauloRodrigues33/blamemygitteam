# Blame My Git Team

## 🤖 Contexto para Inteligências Artificiais

Este projeto é uma **aplicação de monitoramento de repositórios Git** desenvolvida em Next.js que analisa atividade de desenvolvedores em repositórios locais. 

### Propósito Principal
- **Análise de produtividade** de equipes de desenvolvimento
- **Monitoramento de commits** e estatísticas de contribuição
- **Geração de relatórios** gerenciais sobre atividade de código
- **Dashboard centralizado** para visualização de métricas

### Arquitetura Técnica
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: API Routes do Next.js
- **Database**: SQLite local para persistência
- **Git Integration**: Análise direta de repositórios Git via filesystem
- **Authentication**: Sistema simples baseado em senha

### Casos de Uso para Desenvolvimento Futuro
- Implementação de novos tipos de relatórios e métricas
- Melhorias na interface e experiência do usuário
- Otimizações de performance na análise de repositórios
- Integração com ferramentas externas (Jira, Slack, etc.)
- Adição de alertas e notificações automáticas
- Implementação de análise de qualidade de código
- Exportação de dados em múltiplos formatos

---

## 🚀 Visão Geral

Uma plataforma moderna para monitoramento da atividade de colaboradores em repositórios Git, oferecendo uma visão gerencial detalhada das contribuições diárias dos desenvolvedores.

## 🚀 Funcionalidades

### Dashboard Principal
- **Visualização de commits por autor e projeto**
- **Estatísticas em tempo real** (commits hoje, últimos 3 dias, semana)
- **Filtros de data personalizáveis**
- **Métricas de produtividade** (linhas adicionadas/removidas, arquivos modificados)

### Gerenciamento de Repositórios
- **Configuração de repositórios Git locais**
- **Armazenamento seguro** das referências em localStorage
- **Sincronização automática** com banco de dados SQLite
- **Validação de repositórios** Git válidos

### Relatórios Avançados
- **Análise detalhada de produtividade**
- **Top desenvolvedores** por período
- **Atividade por dia** com gráficos
- **Estatísticas por repositório**
- **Exportação de dados** para análise externa

### Autenticação e Segurança
- **Login protegido por senha** configurada no .env
- **Middleware de proteção** de rotas
- **Sessão persistente** no localStorage

### Persistência de Dados
- **SQLite** para armazenamento de commits e estatísticas
- **Backup e restauração** de configurações
- **Sincronização** entre localStorage e banco de dados

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização moderna e responsiva
- **SQLite** - Banco de dados local
- **Simple-Git** - Integração com repositórios Git
- **Lucide React** - Ícones modernos
- **Date-fns** - Manipulação de datas

## 📦 Instalação

1. **Clone o repositório:**
```bash
git clone <url-do-repositorio>
cd blame-my-git-team
```

2. **Instale as dependências:**
```bash
npm install
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local`:
```env
# Configurações da aplicação
ADMIN_PASSWORD=sua_senha_aqui

# Configuração do banco de dados
DATABASE_PATH=./data/app.db
```

4. **Execute o projeto:**
```bash
npm run dev
```

5. **Acesse a aplicação:**
Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🔧 Configuração

### Primeiro Acesso
1. Faça login com a senha configurada no `.env.local`
2. Acesse **Repositórios** no menu lateral
3. Adicione os caminhos dos repositórios Git locais
4. Vá para **Configurações** e execute a sincronização do banco de dados

### Adicionando Repositórios
- Navegue até a página **Repositórios**
- Clique em "Adicionar Repositório"
- Insira o nome e caminho completo do repositório Git
- O sistema validará se é um repositório Git válido

### Sincronização de Dados
- Acesse **Configurações**
- Clique em "Sincronizar Agora" para salvar dados no SQLite
- A sincronização lê todos os commits e gera estatísticas

## 📊 Uso

### Dashboard
- **Filtros rápidos:** Hoje, Últimos 3 dias, Última semana
- **Filtro personalizado:** Selecione datas específicas
- **Estatísticas em tempo real:** Commits, autores ativos, repositórios
- **Lista de commits recentes** com detalhes do autor

### Relatórios
- **Período de análise:** Configure datas de início e fim
- **Top desenvolvedores:** Ranking por commits, linhas e arquivos
- **Atividade diária:** Gráfico de commits por dia
- **Estatísticas gerais:** Visão consolidada do período

### Configurações
- **Sincronização:** Atualize o banco de dados com novos commits
- **Backup:** Exporte configurações em JSON
- **Restauração:** Importe configurações de backup
- **Limpeza:** Remove todos os dados (irreversível)

## 🎯 Insights para Gestores

### Métricas de Produtividade
- **Commits por desenvolvedor:** Identifique os mais ativos
- **Linhas de código:** Analise volume de trabalho
- **Arquivos modificados:** Entenda o escopo das alterações
- **Frequência de commits:** Monitore consistência

### Análise de Equipe
- **Distribuição de trabalho:** Veja como as tarefas estão distribuídas
- **Padrões de atividade:** Identifique dias/períodos mais produtivos
- **Colaboração:** Analise commits em repositórios compartilhados
- **Tendências:** Compare períodos diferentes

### Relatórios Gerenciais
- **Atividade por projeto:** Foque nos repositórios mais importantes
- **Performance individual:** Acompanhe cada desenvolvedor
- **Métricas temporais:** Analise produtividade ao longo do tempo
- **Comparativos:** Compare equipes ou períodos

## 🔒 Segurança

- **Autenticação obrigatória** para acesso
- **Dados locais:** Nenhuma informação é enviada para servidores externos
- **Repositórios locais:** Acesso apenas aos repositórios configurados
- **Backup seguro:** Dados exportados em formato JSON

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas da aplicação (App Router)
│   ├── api/               # API Routes do Next.js
│   ├── dashboard/         # Dashboard principal
│   ├── login/             # Página de autenticação
│   ├── repositories/      # Gerenciamento de repositórios
│   ├── reports/           # Relatórios avançados
│   └── settings/          # Configurações do sistema
├── components/            # Componentes React reutilizáveis
│   └── Navigation.tsx     # Componente de navegação principal
├── hooks/                 # Custom hooks
│   ├── useAuth.ts         # Hook de autenticação
│   └── useDatabase.ts     # Hook de acesso ao banco
├── lib/                   # Utilitários e serviços
│   ├── database.ts        # Operações SQLite
│   ├── git.ts             # Integração com Git
│   └── storage.ts         # LocalStorage utilities
├── types/                 # Definições TypeScript
│   └── index.ts           # Tipos principais
└── middleware.ts          # Middleware de autenticação
```

## 🧠 Informações Técnicas para IAs

### Fluxo de Dados
1. **Configuração**: Usuário adiciona repositórios Git locais
2. **Sincronização**: Sistema lê commits via filesystem
3. **Processamento**: Dados são processados e armazenados no SQLite
4. **Visualização**: Interface exibe métricas e relatórios

### Principais Entidades
- **Repository**: Repositórios Git configurados
- **Commit**: Commits individuais com metadados
- **Author**: Desenvolvedores únicos identificados
- **Stats**: Estatísticas agregadas por período

### Pontos de Extensão
- **Novos tipos de análise**: Adicionar métricas customizadas
- **Integrações externas**: APIs de ferramentas de gestão
- **Alertas automáticos**: Sistema de notificações
- **Análise de qualidade**: Integração com linters/analyzers
- **Relatórios customizados**: Templates configuráveis

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique se todos os repositórios Git estão acessíveis
2. Confirme se as variáveis de ambiente estão configuradas
3. Execute a sincronização do banco de dados
4. Verifique os logs do console para erros específicos
