import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credential, deviceName } = body;

    if (!userId || !credential) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const challenge = cookieStore.get('webauthn_challenge')?.value;

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expirado. Tente novamente' }, { status: 400 });
    }

    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';
    const rpOrigin = process.env.NEXT_PUBLIC_RP_ORIGIN || 'https://fincontrol-three-indol.vercel.app';

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpId,
      });
    } catch (verifyError: any) {
      console.error('[WebAuthn Register Verify] Erro na verificacao:', verifyError.message);
      cookieStore.delete('webauthn_challenge');
      return NextResponse.json({ error: verifyError.message || 'Falha na verificacao' }, { status: 400 });
    }

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Falha na verificacao de registro' }, { status: 400 });
    }

    // No v14, credential.id e uma Base64URLString
    const credentialId = verification.registrationInfo.credential.id;
    const credentialPublicKey = verification.registrationInfo.credential.publicKey;

    // Armazenar com prefixo hex PostgreSQL - Buffer Node.js seria serializado incorretamente via JSON
    const publicKeyHex = `\\x${Buffer.from(credentialPublicKey).toString('hex')}`;

    const { error: insertError } = await supabaseAdmin
      .from('webauthn_credentials')
      .insert({
        usuario_id: parseInt(userId as any),
        credential_id: credentialId,
        public_key: publicKeyHex,
        sign_count: verification.registrationInfo.credential.counter || 0,
        transports: credential.response?.transports || [],
        device_name: deviceName || 'Dispositivo',
      });

    if (insertError) {
      console.error('[WebAuthn Register Verify] Erro ao salvar:', insertError.message);
      throw insertError;
    }

    cookieStore.delete('webauthn_challenge');
    console.log('[WebAuthn Register Verify] Credencial salva com sucesso');

    return NextResponse.json(
      { data: { success: true, message: 'Biometria registrada com sucesso!' } },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[WebAuthn Register Verify] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar registro' }, { status: 500 });
  }
}
