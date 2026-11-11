# 🚀 Guia de Deployment - FinControl

Instruções passo a passo para fazer deploy da aplicação FinControl no Vercel.

## 📋 Pré-requisitos

- [x] Projeto Next.js compilado com sucesso (`npm run build`)
- [x] Repositório Git criado e sincronizado
- [x] Conta GitHub conectada
- [ ] Conta Resend criada e API key gerada
- [ ] Conta Vercel criada (conecta com GitHub)

## 🔧 Passo 1: Preparar o Código Local

### 1.1 Testar Build Localmente

```bash
# Limpar cache
rm -rf .next

# Build production
npm run build

# Testar build
npm run start

# Abrir http://localhost:3000 e testar login
```

### 1.2 Verificar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.local.example .env.local

# Verificar que .env.local existe e tem valores válidos
cat .env.local

# Variáveis obrigatórias:
# - RESEND_API_KEY
# - JWT_SECRET
# - ADMIN_EMAIL
# - NEXT_PUBLIC_APP_URL
```

### 1.3 Commitar Mudanças

```bash
git add .
git commit -m "Fase 9: Preparar para deployment

- Remover endpoint /api/init (temporário)
- Adicionar vercel.json com configurações
- Adicionar .vercelignore para ignorar arquivos locais
- Criar README e guias de deployment
- Todos os testes passando"

git push origin main
```

## 🌐 Passo 2: Deploy no Vercel

### 2.1 Opção A: Via Dashboard Vercel (Recomendado)

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "New Project"
3. Selecione seu repositório GitHub
4. Clique em "Import"
5. Configure Environment Variables:
   - Clique em "Environment Variables"
   - Adicione as 4 variáveis:
     - `RESEND_API_KEY`: Cole sua chave do Resend
     - `JWT_SECRET`: Gere uma string aleatória (32+ caracteres)
     - `ADMIN_EMAIL`: seu-email@dominio.com
     - `NEXT_PUBLIC_APP_URL`: https://seu-projeto.vercel.app (copiar URL após deploy)
6. Clique em "Deploy"
7. Aguarde ~2-3 minutos até completar
8. Teste em https://seu-projeto.vercel.app

### 2.2 Opção B: Via Vercel CLI

```bash
# Instalar Vercel CLI (se não tiver)
npm install -g vercel

# Login na sua conta Vercel
vercel login

# Deploy (primeira vez)
vercel

# Deploy em produção
vercel --prod

# Ver logs
vercel logs

# Configurar variáveis de ambiente (via CLI)
vercel env add RESEND_API_KEY
vercel env add JWT_SECRET
vercel env add ADMIN_EMAIL
vercel env add NEXT_PUBLIC_APP_URL
```

## ✅ Passo 3: Configuração Pós-Deploy

### 3.1 Gerar Usuários de Teste em Produção

**⚠️ IMPORTANTE**: O arquivo `/api/init` foi desabilitado em produção. Use este procedimento alternativo:

#### Opção 1: Criar via Endpoint Manual

1. Acesse a console do Vercel
2. Execute a função de inicialização manualmente
3. Ou: Crie usuários via API:

```bash
# Criar novo usuário via admin
curl -X POST https://seu-projeto.vercel.app/api/admin/usuarios \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=SEU_TOKEN_DE_ADMIN" \
  -d '{
    "nome": "Novo Usuario",
    "email": "novo@email.com",
    "tipo": "user"
  }'
```

#### Opção 2: Popular CSVs Manualmente

1. Criar arquivo `public/data/users.csv` com usuários válidos:

```csv
id,nome,email,senha_hash,tipo_usuario,criado_em,ativo
1,Pai,pai@familia.com,$2b$10$...,admin,2024-01-01T00:00:00Z,true
2,Filha,filha@familia.com,$2b$10$...,user,2024-01-01T00:00:00Z,true
```

2. Criar arquivo `public/data/credits.csv`:

```csv
usuario_id,data_creditada,valor,descricao,admin_que_adicionou,criado_em
2,2024-01-01,5000.00,Mesada,1,2024-01-01T00:00:00Z
```

3. Fazer commit e push (será auto-deployado)

### 3.2 Configurar Email Notifications

1. Acesse https://seu-projeto.vercel.app/admin
2. Login com admin credentials
3. Vá para "Notificações" (Email Configuration)
4. Adicione emails dos destinatários
5. Configure quais notificações recebem (despesa/crédito)

### 3.3 Teste de Funcionalidade Completa

**Checklist de Testes:**

- [ ] Login funciona (admin + user)
- [ ] Dashboard carrega KPI corretamente
- [ ] Adicionar gasto envia email (se RESEND_API_KEY configurada)
- [ ] Admin pode criar novos usuários
- [ ] Admin pode adicionar créditos
- [ ] Relatórios exportam CSV/JSON
- [ ] Logout limpa cookies corretamente
- [ ] Erro 401 em rotas sem autenticação
- [ ] Validação de email e senha funciona
- [ ] CSV persiste entre requisições

## ⚠️ Problemas Comuns

### "Module not found" errors

**Causa**: Path aliases não configurados
**Solução**: Verificar `tsconfig.json` tem:
```json
"paths": {
  "@/*": ["./src/*", "./*"]
}
```

### "RESEND_API_KEY is missing"

**Causa**: Variável não configurada em Environment Variables
**Solução**: 
1. Vercel Dashboard → Settings → Environment Variables
2. Adicionar `RESEND_API_KEY` com valor válido
3. Redeploy: `git push` ou clicar "Redeploy" no Vercel

### "Cannot read file: public/data/users.csv"

**Causa**: Arquivos CSV são efêmeros em serverless (Vercel não persiste em /tmp)
**Solução**: Usar banco de dados (PostgreSQL, MongoDB, Firebase)
**Temporário**: Incluir arquivos CSV no repo em `public/data/`

### "Email não enviado"

**Causa**: Resend API key inválida ou domínio não verificado
**Solução**:
1. Verificar API key em https://resend.com/api-keys
2. Adicionar domínio verificado (pode usar `noreply@[seu-dominio]`)
3. Testar com Resend Console

## 📊 Monitoramento em Produção

### Ver Logs Remotos

```bash
# Logs via CLI
vercel logs --prod

# Logs em tempo real
vercel logs --prod --follow

# Filtrar por status code
vercel logs --prod --since=1h
```

### Verificar Performance

1. Vercel Dashboard → Analytics
2. Monitorar:
   - Response time (objetivo: <500ms)
   - Erro rate (objetivo: 0%)
   - Bandwidth usage

### Alertas

1. Vercel Dashboard → Settings → Alerts
2. Configurar notificações para:
   - Build failures
   - Runtime errors
   - Performance degradation

## 🔄 Atualizar em Produção

Após fazer alterações no código:

```bash
# Testar localmente
npm run dev
npm run build

# Commit e push
git add .
git commit -m "Descrição da mudança"
git push origin main

# Vercel faz auto-deploy automaticamente!
# Ou manualmente via CLI:
vercel --prod
```

## 🗑️ Remover Deployment

Se precisar deletar a aplicação do Vercel:

```bash
# Via CLI
vercel remove --prod

# Ou via Dashboard:
# Settings → Danger Zone → Delete Project
```

## 📝 Checklist Pré-Deploy

- [ ] `npm run build` passa sem erros
- [ ] `npm run start` funciona localmente
- [ ] `.env.local` preenchido com valores válidos
- [ ] `.gitignore` inclui `.env.local` e `.next/`
- [ ] Usuários de teste criados em `public/data/users.csv`
- [ ] RESEND_API_KEY obtida de resend.com
- [ ] JWT_SECRET gerada (string aleatória 32+ chars)
- [ ] Git remoto configurado e sincronizado
- [ ] GitHub account conectada ao Vercel
- [ ] Testou login, dashboard, admin panel

## 🎉 Próximos Passos (Pós-Produção)

1. **Database Migration**:
   - Migrar CSVs para PostgreSQL ou MongoDB
   - Usar Prisma ORM

2. **Melhorias de Performance**:
   - Cache com Redis
   - CDN para assets estáticos
   - Image optimization

3. **Segurança Aprimorada**:
   - Rate limiting na API
   - 2FA (two-factor authentication)
   - Audit logs para admin actions

4. **Features Novas**:
   - Gráficos de gastos (Chart.js)
   - Categorias de despesas
   - Metas e budgets
   - Integração com banco (Open Banking)

---

**Versão**: 1.0 - Deployment Ready
**Data**: 2024-11-11
**Status**: ✅ Pronto para Produção
