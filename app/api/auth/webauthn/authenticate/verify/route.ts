import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Verifica resposta de autenticação WebAuthn e faz login
 * POST /api/auth/webauthn/authenticate/verify
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, credential } = body;

    console.log('[WebAuthn Authenticate Verify] Recebido:', { userId, hasCredential: !!credential });

    if (!userId || !credential) {
      console.log('[WebAuthn Authenticate Verify] Dados inválidos');
      return NextResponse.json(
        { error: 'Dados de autenticação inválidos' },
        { status: 400 }
      );
    }

    // Recuperar challenge do cookie
    const cookieStore = await cookies();
    const challenge = cookieStore.get('webauthn_challenge')?.value;

    console.log('[WebAuthn Authenticate Verify] Challenge recuperado:', !!challenge);

    if (!challenge) {
      console.log('[WebAuthn Authenticate Verify] Challenge expirado ou não encontrado');
      return NextResponse.json(
        { error: 'Challenge expirado. Tente novamente' },
        { status: 400 }
      );
    }

    try {
      // Buscar credencial no banco de dados
      const { data: dbCredential, error: credError } = await supabaseAdmin
        .from('webauthn_credentials')
        .select('*')
        .eq('usuario_id', parseInt(userId as any))
        .eq('credential_id', credential.id)
        .single();

      console.log('[WebAuthn Authenticate Verify] Credencial buscada:', !!dbCredential, credError?.message);

      if (credError || !dbCredential) {
        console.log('[WebAuthn Authenticate Verify] Credencial não encontrada');
        return NextResponse.json(
          { error: 'Credencial não encontrada' },
          { status: 404 }
        );
      }

      // Verificar resposta de autenticação
      console.log('[WebAuthn Authenticate Verify] Verificando resposta de autenticação');
      const rpId = process.env.NEXT_PUBLIC_RP_ID || 'fincontrol-three-indol.vercel.app';
      const rpOrigin = process.env.NEXT_PUBLIC_RP_ORIGIN || 'https://fincontrol-three-indol.vercel.app';
      
      console.log('[WebAuthn Authenticate Verify] Usando RP_ID:', rpId, 'RP_ORIGIN:', rpOrigin);
      
      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge: challenge,
        expectedOrigin: rpOrigin,
        expectedRPID: rpId,
        credential: {
          id: dbCredential.credential_id,
          publicKey: Buffer.from(dbCredential.public_key),
          counter: dbCredential.sign_count,
          transports: dbCredential.transports || ['internal'],
        },
      });

      console.log('[WebAuthn Authenticate Verify] Verificação concluída:', verification.verified);

      if (!verification.verified) {
        console.log('[WebAuthn Authenticate Verify] Falha na verificação');
        return NextResponse.json(
          { error: 'Falha na verificação de autenticação' },
          { status: 400 }
        );
      }

      // Verificar e atualizar counter (proteção contra clonagem)
      if (verification.authenticationInfo.newCounter <= dbCredential.sign_count) {
        console.warn(`Possível ataque de clonagem detectado para usuário ${userId}`);
        return NextResponse.json(
          { error: 'Falha na segurança. Contate o suporte' },
          { status: 403 }
        );
      }

      // Atualizar último uso e counter
      await supabaseAdmin
        .from('webauthn_credentials')
        .update({
          last_used_at: new Date().toISOString(),
          sign_count: verification.authenticationInfo.newCounter,
          updated_at: new Date().toISOString(),
        })
        .eq('id', dbCredential.id);

      // Buscar dados do usuário
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json(
          { error: 'Usuário não encontrado' },
          { status: 404 }
        );
      }

      // Gerar JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, tipo_usuario: user.tipo_usuario },
        process.env.JWT_SECRET || 'secret-key',
        { expiresIn: '7d' }
      );

      // Salvar token em cookie
      const newCookieStore = await cookies();
      newCookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 dias
      });

      // Limpar challenge do cookie
      newCookieStore.delete('webauthn_challenge');

      return NextResponse.json(
        {
          data: {
            id: user.id,
            email: user.email,
            nome: user.nome,
            tipo_usuario: user.tipo_usuario,
            senha_temporaria: user.senha_temporaria,
          },
        },
        { status: 200 }
      );
    } catch (verifyError: any) {
      console.error('Erro ao verificar autenticação:', verifyError);
      return NextResponse.json(
        { error: verifyError.message || 'Falha na verificação de autenticação' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Erro ao processar autenticação WebAuthn:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar autenticação' },
      { status: 500 }
    );
  }
}
