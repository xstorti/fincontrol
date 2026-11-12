import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';
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

    // Converter challenge para base64url (como string para transmissão)
    const challengeBase64url = bufferToBase64url(options.challenge as any);
    console.log('[WebAuthn Register Options] Challenge convertido para base64url:', challengeBase64url.substring(0, 20) + '...');

    // Converter user.id para base64url (como string para transmissão)
    const userIdBase64url = bufferToBase64url(options.user.id as any);
    console.log('[WebAuthn Register Options] User ID convertido para base64url:', userIdBase64url.substring(0, 20) + '...');

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
      rp: options.rp,
      user: {
        ...options.user,
        id: userIdBase64url,
      },
      pubKeyCredParams: options.pubKeyCredParams,
      authenticatorSelection: options.authenticatorSelection,
      timeout: options.timeout,
      attestation: options.attestation,
    };

    console.log('[WebAuthn Register Options] Safe options estrutura:');
    console.log('[WebAuthn Register Options] Keys:', Object.keys(safeOptions));
    console.log('[WebAuthn Register Options] challenge type:', typeof safeOptions.challenge, 'length:', safeOptions.challenge?.length);
    console.log('[WebAuthn Register Options] user.id type:', typeof safeOptions.user.id, 'length:', safeOptions.user.id?.length);
    console.log('[WebAuthn Register Options] attestation:', safeOptions.attestation);

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
