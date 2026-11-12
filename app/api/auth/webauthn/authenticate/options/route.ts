import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email e obrigatorio' }, { status: 400 });
    }

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const { data: credentials, error: credError } = await supabaseAdmin
      .from('webauthn_credentials')
      .select('credential_id, transports')
      .eq('usuario_id', parseInt(user.id as any));

    if (credError || !credentials || credentials.length === 0) {
      return NextResponse.json({ error: 'Nenhuma biometria registrada para este usuario' }, { status: 404 });
    }

    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';

    // SimpleWebAuthn v14: allowCredentials espera Base64URLString para id
    const options = await generateAuthenticationOptions({
      rpID: rpId,
      allowCredentials: credentials.map((cred: any) => ({
        id: cred.credential_id,
        transports: cred.transports || ['internal'],
      })),
      userVerification: 'preferred',
      timeout: 60000,
    });

    console.log('[WebAuthn Auth Options] challenge:', (options.challenge as string).substring(0, 20));

    const cookieStore = await cookies();
    cookieStore.set('webauthn_challenge', options.challenge as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
    });

    return NextResponse.json(
      { data: { options, userId: user.id, email: user.email } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[WebAuthn Auth Options] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar opcoes' }, { status: 500 });
  }
}
