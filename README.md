# 💰 FinControl - Controle Financeiro Familiar

Aplicação web para gerenciar despesas e créditos da família com autenticação, painel admin e relatórios.

## 🚀 Características

- ✅ **Autenticação Segura**: Login com email/senha, JWT em cookies HttpOnly
- ✅ **Dashboard de KPI**: Visualize saldo, gasto e média diária (personalizável por período)
- ✅ **Gestão de Gastos**: Adicionar despesas com data, descrição e valor
- ✅ **Relatórios**: Filtrar e exportar transações em CSV/JSON
- ✅ **Painel Admin**:
  - 👥 Gerenciar usuários (criar, ativar/desativar)
  - 💰 Adicionar créditos (mesada, reembolsos)
  - 📧 Configurar notificações por email
  - 📊 Visualizar estatísticas e relatórios
- ✅ **Notificações**: Email automático para admins (usando Resend)
- ✅ **Design Mobile-First**: Responsivo com Tailwind CSS v4
- ✅ **TypeScript**: Type-safe em todo o stack

## 🛠 Stack Técnico

- **Frontend**: Next.js 15 (App Router) + React + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: API Routes (Node.js)
- **Autenticação**: JWT + HttpOnly Cookies
- **Armazenamento**: CSV (público/data/) + JSON
- **Email**: Resend API
- **Segurança**: bcryptjs (hash de senhas)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta Resend (free tier adequado)

## 🔧 Instalação Local

```bash
# 1. Clone o repositório
git clone <seu-repo>
cd fincontrol

# 2. Instale dependências
npm install

# 3. Configure variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com seus valores:
# - RESEND_API_KEY: sua chave do Resend
# - JWT_SECRET: qualquer string segura
# - ADMIN_EMAIL: email do admin principal
# - NEXT_PUBLIC_APP_URL: http://localhost:3000 (dev)

# 4. Inicie o servidor de desenvolvimento
npm run dev

# 5. Abra http://localhost:3000
```

## 👤 Usuários Padrão (Desenvolvimento)

A aplicação cria automaticamente 3 usuários na primeira execução:

| Nome  | Email              | Senha    | Tipo  |
|-------|-------------------|----------|-------|
| Pai   | pai@familia.com   | admin123 | admin |
| Mãe   | mae@familia.com   | admin123 | admin |
| Filha | filha@familia.com | user123  | user  |

**Saldo inicial**: R$ 10.000 (Filha)

## 📱 Uso Principal

### Para Usuários Normais
1. **Login**: Use suas credenciais
2. **Dashboard**: Veja saldo, gastos e KPI
3. **Adicionar Gasto**: Clique em "+ Adicionar Gasto"
4. **Relatório**: Veja histórico e exporte dados
5. **Logout**: Clique em "Sair"

### Para Admins (tudo acima + )
1. **Painel Admin**: Link de acesso rápido no dashboard
2. **Usuários**: Criar novos usuários com senha temporária
3. **Créditos**: Adicionar saldo/mesada para usuários
4. **Notificações**: Configurar emails que recebem alertas
5. **Relatórios Admin**: Visualizar dados de qualquer usuário

## 🔐 Segurança

- ✅ Senhas hasheadas com bcryptjs (10 rounds)
- ✅ JWT verificado em todas as rotas protegidas
- ✅ Cookies HttpOnly + Secure + SameSite
- ✅ Validação de entrada em API routes
- ✅ Proteção contra auto-deletação de admins
- ✅ Email de admin configurável

## 📧 Configuração de Email

1. **Criar conta Resend**: [resend.com](https://resend.com)
2. **Copiar API Key** do painel Resend
3. **Adicionar chave a .env.local**: `RESEND_API_KEY=re_xxxxx`
4. **No painel admin**: Configure email destinatário e tipos de notificação
5. **Notificações automáticas** ao:
   - Adicionar gasto (email ao usuário + admins)
   - Adicionar crédito (email ao usuário + admins)

## 📦 Estrutura de Arquivos

```
fincontrol/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/              # Login, logout, me
│   │   ├── transacoes/        # Gastos CRUD
│   │   ├── admin/             # Rotas de admin
│   │   └── saldo, relatorio/  # Dados e relatórios
│   ├── login/                 # Página de login
│   ├── dashboard/             # Dashboard principal
│   ├── adicionar-gasto/       # Formulário de despesa
│   ├── relatorio/             # Relatório de usuário
│   └── admin/                 # Páginas de admin
├── src/
│   ├── components/            # Componentes React
│   ├── lib/                   # Utilidades
│   │   ├── auth.ts           # Lógica de autenticação
│   │   ├── csv.ts            # CRUD de arquivos
│   │   ├── email.ts          # Envio de emails
│   │   ├── kpi.ts            # Cálculos financeiros
│   │   ├── middleware.ts     # Guards de autenticação
│   │   └── utils.ts          # Funções utilitárias
│   └── types/                # Interfaces TypeScript
├── public/data/              # Arquivos CSV (gerado automaticamente)
├── .env.local               # Variáveis de ambiente
├── tailwind.config.ts       # Configuração Tailwind
└── next.config.ts           # Configuração Next.js
```

## 🚀 Deployment (Vercel)

### Passo 1: Preparar para Deploy

```bash
# Build local para testar
npm run build

# Testar build
npm run start
```

### Passo 2: Fazer Push do Código

```bash
git add .
git commit -m "FinControl v1.0"
git push origin main
```

### Passo 3: Deploy no Vercel

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel

# Ou via GitHub: conecte seu repo em vercel.com
```

### Passo 4: Configurar Variáveis de Ambiente

No **Vercel Dashboard**:
1. Vá para seu projeto
2. Settings → Environment Variables
3. Adicione:
   ```
   RESEND_API_KEY=re_xxxxx
   JWT_SECRET=sua-chave-segura-aleatoria
   ADMIN_EMAIL=seu-email@dominio.com
   NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
   ```

### Passo 5: Deploy e Testes

```bash
# Redeploy com variáveis
vercel --prod

# Teste em: https://seu-dominio.vercel.app
```

## ⚠️ Limitações Conhecidas

1. **CSV em Serverless**: Arquivos CSV podem ser perdidos entre deploys no Vercel
   - ✅ Solução: Usar banco de dados (PostgreSQL, MongoDB) em produção
   
2. **Armazenamento Persistente**: Recomenda-se migrar para:
   - PostgreSQL + Prisma
   - MongoDB + Mongoose
   - Firebase Firestore
   - AWS DynamoDB

3. **Email**: Requer Resend API key válida em produção

## 🔄 Próximas Melhorias

- [ ] Migração para banco de dados relacional
- [ ] Autenticação OAuth (Google, GitHub)
- [ ] Gráficos e análises avançadas
- [ ] App mobile nativa (React Native)
- [ ] Dark mode
- [ ] Categorias de despesas
- [ ] Metas e orçamentos
- [ ] Compartilhamento de relatórios

## 📝 Licença

Projeto educacional - uso livre

## 🆘 Suporte

Para problemas:
1. Verifique se `.env.local` tem todas as variáveis
2. Limpe cache: `rm -rf .next && npm run dev`
3. Confira logs: `npm run dev` mostrará erros em tempo real
4. Verifique CSV: `public/data/users.csv` deve ter usuários

## 📞 Contato

Desenvolvido como projeto educacional de controle financeiro familiar.

---

**Versão Atual**: 1.0 (Fase 9 - Pronto para Deploy)
**Última atualização**: 2024
