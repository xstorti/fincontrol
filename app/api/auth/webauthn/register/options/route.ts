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

    console.log('[WebAuthn Register Options] Email recebido:', email);

    // Buscar usuário
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, nome, email')
      .eq('email', email)
      .single();

    if (userError || !user) {
      console.log('[WebAuthn Register Options] Usuário não encontrado:', email);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log('[WebAuthn Register Options] Usuário encontrado:', user.id);

    // Converter id para Buffer (WebAuthn requer ArrayBuffer)
    const userIdBuffer = Buffer.alloc(8);
    userIdBuffer.writeBigInt64BE(BigInt(user.id));

    // Gerar opções de registro WebAuthn
    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';
    console.log('[WebAuthn Register Options] Usando RP_ID:', rpId);
    
    const options = await generateRegistrationOptions({
      rpID: rpId,
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
      // Remover qualquer transporte que não seja platform (evita QR code)
      supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    });

    console.log('[WebAuthn Register Options] Options geradas:', {
      challenge: !!options.challenge,
      rp: !!options.rp,
      user: !!options.user,
      pubKeyCredParams: options.pubKeyCredParams?.length,
    });

    // Salvar challenge na sessão/cookie para validação posterior
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
      rp: options.rp,
      user: options.user,
      pubKeyCredParams: options.pubKeyCredParams,
      authenticatorSelection: options.authenticatorSelection,
      timeout: options.timeout,
      attestation: options.attestation,
    };

    console.log('[WebAuthn Register Options] Safe options pronta para envio');

    return NextResponse.json(
      {
        data: {
          options: safeOptions,
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
