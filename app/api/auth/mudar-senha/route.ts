import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { hashPassword, comparePassword } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 401);
    }

    const body = await req.json();
    const { senhaAtual, senhaNova } = body;

    // Validate input
    if (!senhaAtual || !senhaNova) {
      return createErrorResponse('Senha atual e nova são obrigatórias', 400);
    }

    if (senhaNova.length < 6) {
      return createErrorResponse('Nova senha deve ter pelo menos 6 caracteres', 400);
    }

    // Get user from database
    const { data: users, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !users) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Verify current password
    const passwordMatch = await comparePassword(senhaAtual, users.senha_hash);

    if (!passwordMatch) {
      return createErrorResponse('Senha atual incorreta', 401);
    }

    // Hash new password
    const novaSenhaHash = await hashPassword(senhaNova);

    // Update password and mark as not temporary
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        senha_hash: novaSenhaHash,
        senha_temporaria: false,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return createErrorResponse('Erro ao alterar senha', 500);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Senha alterada com sucesso',
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Change password error:', error);
    return createErrorResponse('Erro ao alterar senha', 500);
  }
}
