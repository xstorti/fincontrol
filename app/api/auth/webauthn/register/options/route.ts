import { generateRegistrationOptions } from '@simplewebauthn/server';
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

    console.log('[WebAuthn Register Options] Email:', email);

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, nome, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    // userID deve ser Uint8Array com 8 bytes
    const userIdBuffer = Buffer.alloc(8);
    userIdBuffer.writeBigInt64BE(BigInt(user.id));

    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';

    // SimpleWebAuthn v14: generateRegistrationOptions retorna strings base64url
    const options = await generateRegistrationOptions({
      rpID: rpId,
      rpName: 'FinControl',
      userName: email,
      userID: userIdBuffer,
      userDisplayName: user.nome || email,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      attestationType: 'direct',
      timeout: 60000,
    });

    console.log('[WebAuthn Register Options] challenge:', (options.challenge as string).substring(0, 20));

    // Salvar challenge (ja e base64url string no v14)
    const cookieStore = await cookies();
    cookieStore.set('webauthn_challenge', options.challenge as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300,
    });

    return NextResponse.json(
      { data: { options, userId: user.id } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[WebAuthn Register Options] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar opcoes' }, { status: 500 });
  }
}
