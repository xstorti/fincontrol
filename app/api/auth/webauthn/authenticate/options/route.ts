import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * Converter Uint8Array ou Buffer para base64url string
 * Base64url: - em vez de +, _ em vez de /, sem padding
 */
function bufferToBase64url(buffer: Uint8Array | ArrayBuffer | Buffer): string {
  // Converter para Uint8Array se necessário
  let bytes: Uint8Array;
  if (buffer instanceof Uint8Array) {
    bytes = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else if (Buffer.isBuffer(buffer)) {
    bytes = new Uint8Array(buffer);
  } else {
    bytes = new Uint8Array(buffer as any);
  }

  // Converter para base64
  const binaryString = String.fromCharCode(...bytes);
  const base64 = Buffer.from(binaryString, 'binary').toString('base64');

  // Converter base64 para base64url (substituir + por -, / por _, remover =)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Gera opções de autenticação WebAuthn para login
 * POST /api/auth/webauthn/authenticate/options
 * Body: { email: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    console.log('[WebAuthn Authenticate Options] Email recebido:', email);

    // Buscar usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('[WebAuthn Authenticate Options] Usuário não encontrado:', email);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('[WebAuthn Authenticate Options] Usuário encontrado, buscando credenciais');

    // Buscar credenciais WebAuthn do usuário
    const { data: credentials, error: credError } = await supabaseAdmin
      .from('webauthn_credentials')
      .select('credential_id, public_key, transports')
      .eq('usuario_id', parseInt(user.id as any));

    if (credError || !credentials || credentials.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma biometria registrada para este usuário' },
        { status: 404 }
      );
    }

    // Gerar opções de autenticação
    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';
    console.log('[WebAuthn Authenticate Options] Usando RP_ID:', rpId);
    
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials: credentials.map((cred: any) => ({
        id: cred.credential_id,
        type: 'public-key',
        transports: cred.transports || ['internal'],
      })),
      userVerification: 'preferred',
      timeout: 60000,
    });

    console.log('[WebAuthn Authenticate Options] Options geradas:', {
      challenge: !!options.challenge,
      allowCredentials: options.allowCredentials?.length,
    });

    // Converter challenge para base64url (como string para transmissão)
    const challengeBase64url = bufferToBase64url(options.challenge as any);
    console.log('[WebAuthn Authenticate Options] Challenge convertido para base64url:', challengeBase64url.substring(0, 20) + '...');

    // Converter allowCredentials id's para base64url também
    const allowCredentialsBase64url = (options.allowCredentials || []).map((cred: any) => ({
      ...cred,
      id: typeof cred.id === 'string' ? cred.id : bufferToBase64url(cred.id as any),
    }));

    // Salvar challenge no cookie para validação posterior
    const cookieStore = await cookies();
    cookieStore.set('webauthn_challenge', challengeBase64url, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutos
    });

    // Converter para formato seguro para JSON com base64url strings
    const safeOptions = {
      challenge: challengeBase64url,
      timeout: options.timeout,
      rpId: options.rpId,
      allowCredentials: allowCredentialsBase64url,
      userVerification: options.userVerification,
    };

    console.log('[WebAuthn Authenticate Options] Safe options pronta para envio');

    return NextResponse.json(
      {
        data: {
          options: safeOptions,
          userId: user.id,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao gerar opções de autenticação WebAuthn:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar opções de autenticação' },
      { status: 500 }
    );
  }
}
