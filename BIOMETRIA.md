# 🔐 Autenticação Biométrica (WebAuthn)

## 📱 Visão Geral

O FinControl agora suporta autenticação biométrica usando **WebAuthn** (W3C Web Authentication API), permitindo login rápido e seguro via:

- **iPhone/iPad**: Face ID ou Touch ID
- **Android**: Biometria (Fingerprint, Face, Iris, etc.)

## ✨ Características

✅ **Totalmente Seguro**: Usa padrão W3C e criptografia de chave pública
✅ **Sem Servidor de Senhas**: As chaves biométricas nunca deixam o dispositivo
✅ **Fallback Seguro**: Sempre mantém login por email/senha como opção
✅ **Proteção contra Clonagem**: Valida counter de assinatura em cada autenticação
✅ **Múltiplos Dispositivos**: Usuário pode registrar biometria em vários aparelhos

## 🚀 Como Usar

### 1️⃣ Fazer Login com Biometria

Na página de login (/login), após inserir o email:

```
┌─ Login ─────────────────┐
│ Email: seu@email.com    │
│ Senha: ••••••••         │
│ [Entrar]                │
├─────────────────────────┤
│          OU             │
│ [👆 Entrar com Biometria]│
└─────────────────────────┘
```

- **Primeiro Acesso**: Use email e senha
- **Após Registrar**: Clique em "Entrar com Biometria" para ativar a biometria do dispositivo

### 2️⃣ Registrar Biometria (Primeiro Acesso)

Após fazer login por email/senha, acesse **Configurações** e procure por **"Login com Biometria"**:

```
┌─ Configurações ─────────────────────────┐
│ 👆 Login com Biometria                  │
│ Registre sua biometria para fazer login │
│ [Registrar Biometria]                   │
└─────────────────────────────────────────┘
```

- Digite um nome para o dispositivo (ex: "Meu iPhone")
- Confirme sua biometria (Face ID/Touch ID ou Fingerprint)
- Pronto! Próximos logins serão instantâneos

### 3️⃣ Gerenciar Dispositivos Registrados

Na página de **Configurações** → **Meus Dispositivos**:

- Visualize todos os dispositivos com biometria registrada
- Veja última data de uso
- Remova dispositivos que não usa mais

## 🔧 Configuração (Administrador)

### Pré-requisitos

1. **Tabela no Supabase**: Execute a migração SQL
2. **Variáveis de Ambiente**: Configure RP_ID e RP_ORIGIN

### Passo 1: Criar Tabela WebAuthn

Execute no **SQL Editor do Supabase**:

```sql
-- migrations/20261112_webauthn_credentials.sql
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0,
  transports TEXT[],
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webauthn_usuario_id ON webauthn_credentials(usuario_id);
CREATE INDEX idx_webauthn_credential_id ON webauthn_credentials(credential_id);

ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas credenciais WebAuthn" ON webauthn_credentials
  FOR SELECT USING (usuario_id = auth.uid()::uuid);

CREATE POLICY "Sistema pode inserir credenciais WebAuthn" ON webauthn_credentials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem deletar suas credenciais" ON webauthn_credentials
  FOR DELETE USING (usuario_id = auth.uid()::uuid);
```

### Passo 2: Configurar Variáveis de Ambiente

#### Desenvolvimento (.env.local)

```env
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_RP_ORIGIN=http://localhost:3000
```

#### Produção (Vercel)

```env
NEXT_PUBLIC_RP_ID=fincontrol-three-indol.vercel.app
NEXT_PUBLIC_RP_ORIGIN=https://fincontrol-three-indol.vercel.app
```

> **⚠️ IMPORTANTE**: O `RP_ID` deve ser exatamente o domínio da sua aplicação (sem https://)

## 📊 API Endpoints

### Registrar Biometria

**POST** `/api/auth/webauthn/register/options`
```json
{
  "email": "user@example.com"
}
```

**POST** `/api/auth/webauthn/register/verify`
```json
{
  "userId": "uuid",
  "credential": { /* WebAuthn credential */ },
  "deviceName": "Meu iPhone"
}
```

### Fazer Login com Biometria

**POST** `/api/auth/webauthn/authenticate/options`
```json
{
  "email": "user@example.com"
}
```

**POST** `/api/auth/webauthn/authenticate/verify`
```json
{
  "userId": "uuid",
  "credential": { /* WebAuthn credential */ }
}
```

## 🛡️ Segurança

### Como Funciona

1. **Registro**: 
   - Dispositivo gera um par de chaves (privada + pública)
   - Chave pública é salva no servidor
   - Chave privada NUNCA sai do dispositivo

2. **Autenticação**:
   - Servidor envia um desafio (challenge)
   - Dispositivo assina o desafio com a chave privada
   - Servidor verifica a assinatura com a chave pública
   - Counter é validado (proteção contra clonagem)

### Proteção contra Ataques

- ✅ **Clonagem**: Counter de assinatura é verificado
- ✅ **Replay**: Challenge é usado apenas uma vez
- ✅ **MITM**: Validação de origin e RP_ID
- ✅ **Phishing**: WebAuthn vinculado especificamente ao domínio
- ✅ **Brute Force**: Sessão expirada em 5 minutos

## 🐛 Troubleshooting

### "Biometria não disponível"

**Causa**: Dispositivo não suporta WebAuthn

**Solução**: 
- iOS 14+ ou Android 7+ com navegador moderno (Chrome, Firefox, Safari)
- Dispositivo deve ter biometria configurada (Face ID, Touch ID, Fingerprint)

### "Challenge expirado"

**Causa**: Levou mais de 5 minutos para completar registro/login

**Solução**: Tente novamente, a sessão é renovada

### "Falha na verificação"

**Causa**: Dados corrompidos ou navegador não compatível

**Solução**: Use email e senha, tente novamente depois

## 📱 Compatibilidade

| Navegador | iOS | Android | Desktop |
|-----------|-----|---------|---------|
| Safari | ✅ iOS 14+ | N/A | ✅ |
| Chrome | ✅ iOS 16+ | ✅ | ✅ |
| Firefox | ✅ iOS 16+ | ✅ | ✅ |
| Edge | ✅ iOS 16+ | ✅ | ✅ |

## 🔐 Melhores Práticas

1. **Sempre use senha forte** como backup
2. **Registre em vários dispositivos** para não ficar travado
3. **Remova dispositivos perdidos** da lista de gerenciamento
4. **Atualize seu OS** para ter suporte WebAuthn mais recente
5. **Use em redes seguras** (WiFi confiável ou 4G/5G)

## 📚 Referências

- [MDN - Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [W3C - WebAuthn Level 2](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn](https://simplewebauthn.dev/)
- [FIDO2 Alliance](https://fidoalliance.org/)

## 🚀 Próximas Melhorias

- [ ] Gerenciador visual de dispositivos registrados
- [ ] Notificações de novo dispositivo registrado
- [ ] Backup recovery codes
- [ ] Autenticação de dois fatores (2FA) com biometria
