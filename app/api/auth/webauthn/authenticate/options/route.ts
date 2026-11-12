import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

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
    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID || 'fincontrol-three-indol.vercel.app',
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

    // Salvar challenge no cookie para validação posterior
    const cookieStore = await cookies();
    cookieStore.set('webauthn_challenge', (options as any).challenge as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutos
    });

    // Converter para formato seguro para JSON
    const safeOptions = {
      challenge: options.challenge,
      timeout: options.timeout,
      rpId: options.rpId,
      allowCredentials: options.allowCredentials,
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
