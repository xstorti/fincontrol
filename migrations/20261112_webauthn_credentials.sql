-- Criar tabela de credenciais WebAuthn para autenticação biométrica
CREATE TABLE IF NOT EXISTS webauthn_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key BYTEA NOT NULL,
  sign_count INTEGER NOT NULL DEFAULT 0,
  transports TEXT[], -- "internal", "usb", "ble", "nfc"
  device_name TEXT, -- "iPhone", "Samsung Galaxy", etc
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para buscar credenciais por usuário
CREATE INDEX IF NOT EXISTS idx_webauthn_usuario_id ON webauthn_credentials(usuario_id);

-- Índice para buscar por credential_id
CREATE INDEX IF NOT EXISTS idx_webauthn_credential_id ON webauthn_credentials(credential_id);

-- RLS Policy - Usuários podem ver apenas suas próprias credenciais
ALTER TABLE webauthn_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas credenciais WebAuthn" ON webauthn_credentials
  FOR SELECT USING (usuario_id = auth.uid()::uuid);

CREATE POLICY "Sistema pode inserir credenciais WebAuthn" ON webauthn_credentials
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem deletar suas credenciais" ON webauthn_credentials
  FOR DELETE USING (usuario_id = auth.uid()::uuid);
