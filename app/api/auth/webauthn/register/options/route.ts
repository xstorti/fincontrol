import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * Gera opções de registro WebAuthn
 * POST /api/auth/webauthn/register/options
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

    // Buscar usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, nome, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Converter id para Buffer (WebAuthn requer ArrayBuffer)
    const userIdBuffer = Buffer.alloc(8);
    userIdBuffer.writeBigInt64BE(BigInt(user.id));

    // Gerar opções de registro WebAuthn
    const options = generateRegistrationOptions({
      rpID: process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app',
      rpName: 'FinControl',
      userName: email,
      userID: userIdBuffer,
      userDisplayName: user.nome,
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Apenas biometria do dispositivo
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
      attestationType: 'direct',
      timeout: 60000,
    });

    // Salvar challenge na sessão/cookie para validação posterior
    const cookieStore = await cookies();
    cookieStore.set('webauthn_challenge', (options as any).challenge as string, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 300, // 5 minutos
    });

    return NextResponse.json(
      {
        data: {
          options,
          userId: user.id,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao gerar opções de registro WebAuthn:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar opções de registro' },
      { status: 500 }
    );
  }
}
