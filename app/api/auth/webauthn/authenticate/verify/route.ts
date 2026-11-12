import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credential } = body;

    if (!userId || !credential) {
      return NextResponse.json({ error: 'Dados invalidos' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const challenge = cookieStore.get('webauthn_challenge')?.value;

    if (!challenge) {
      return NextResponse.json({ error: 'Challenge expirado. Tente novamente' }, { status: 400 });
    }

    // credential.id vem do browser como Base64URLString
    const credentialId: string = credential.id;
    console.log('[WebAuthn Auth Verify] credential.id:', credentialId, 'length:', credentialId?.length);

    const { data: dbCredential, error: credError } = await supabaseAdmin
      .from('webauthn_credentials')
      .select('*')
      .eq('usuario_id', parseInt(userId as any))
      .eq('credential_id', credentialId)
      .single();

    if (credError || !dbCredential) {
      // Debug: mostrar todas as credenciais do usuario
      const { data: allCreds } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('credential_id')
        .eq('usuario_id', parseInt(userId as any));
      console.log('[WebAuthn Auth Verify] Credenciais do usuario:', allCreds?.map((c: any) => c.credential_id));
      console.log('[WebAuthn Auth Verify] Buscando por:', credentialId);
      return NextResponse.json({ error: 'Credencial nao encontrada' }, { status: 404 });
    }

    const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';
    const rpOrigin = process.env.NEXT_PUBLIC_RP_ORIGIN || 'https://fincontrol-three-indol.vercel.app';

    let verification;
    try {
      // No v14: credential.id deve ser Base64URLString, publicKey como Uint8Array
      verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpId,
        credential: {
          id: dbCredential.credential_id,
          publicKey: new Uint8Array(Buffer.from(dbCredential.public_key)),
          counter: dbCredential.sign_count,
          transports: dbCredential.transports || ['internal'],
        },
      });
    } catch (verifyError: any) {
      console.error('[WebAuthn Auth Verify] Erro na verificacao:', verifyError.message);
      cookieStore.delete('webauthn_challenge');
      return NextResponse.json({ error: verifyError.message || 'Falha na verificacao' }, { status: 400 });
    }

    if (!verification.verified) {
      return NextResponse.json({ error: 'Falha na verificacao de autenticacao' }, { status: 400 });
    }

    // Atualizar counter
    await supabaseAdmin
      .from('webauthn_credentials')
      .update({
        sign_count: verification.authenticationInfo.newCounter,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', dbCredential.id);

    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario nao encontrado' }, { status: 404 });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, tipo_usuario: user.tipo_usuario },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '7d' }
    );

    const newCookieStore = await cookies();
    newCookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });
    newCookieStore.delete('webauthn_challenge');

    console.log('[WebAuthn Auth Verify] Login biometrico bem-sucedido para usuario:', user.id);

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        tipo_usuario: user.tipo_usuario,
        senha_temporaria: user.senha_temporaria,
      },
    }, { status: 200 });
  } catch (error: any) {
    console.error('[WebAuthn Auth Verify] Erro:', error);
    return NextResponse.json({ error: error.message || 'Erro ao processar autenticacao' }, { status: 500 });
  }
}
