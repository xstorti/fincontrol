import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

/**
 * Verifica resposta de registro WebAuthn e salva credencial
 * POST /api/auth/webauthn/register/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credential, deviceName } = body;

    console.log('[WebAuthn Register Verify] Recebido:', { userId, deviceName, hasCredential: !!credential });

    if (!userId || !credential) {
      console.log('[WebAuthn Register Verify] Dados inválidos');
      return NextResponse.json(
        { error: 'Dados de credencial inválidos' },
        { status: 400 }
      );
    }

    // Recuperar challenge do cookie
    const cookieStore = await cookies();
    const challenge = cookieStore.get('webauthn_challenge')?.value;

    console.log('[WebAuthn Register Verify] Challenge recuperado:', !!challenge);

    if (!challenge) {
      console.log('[WebAuthn Register Verify] Challenge expirado ou não encontrado');
      return NextResponse.json(
        { error: 'Challenge expirado. Tente novamente' },
        { status: 400 }
      );
    }

    try {
      // Verificar resposta de registro
      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: process.env.RP_ORIGIN || 'https://fincontrol-three-indol.vercel.app',
        expectedRPID: process.env.RP_ID || 'fincontrol-three-indol.vercel.app',
      });

      if (!verification.verified) {
        return NextResponse.json(
          { error: 'Falha na verificação de registro' },
          { status: 400 }
        );
      }

      // Salvar credencial no banco de dados
      const { data, error } = await supabaseAdmin
        .from('webauthn_credentials')
        .insert({
          usuario_id: parseInt(userId as any),
          credential_id: verification.registrationInfo?.credential.id,
          public_key: Buffer.from(verification.registrationInfo?.credential.publicKey || []),
          sign_count: 0,
          transports: credential.response?.transports || [],
          device_name: deviceName || 'Dispositivo',
        });

      if (error) {
        throw error;
      }

      // Limpar challenge do cookie
      cookieStore.delete('webauthn_challenge');

      return NextResponse.json(
        {
          data: {
            success: true,
            message: 'Biometria registrada com sucesso!',
          },
        },
        { status: 200 }
      );
    } catch (verifyError: any) {
      console.error('Erro ao verificar registro:', verifyError);
      return NextResponse.json(
        { error: verifyError.message || 'Falha na verificação de registro' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao processar registro WebAuthn:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar registro' },
      { status: 500 }
    );
  }
}
