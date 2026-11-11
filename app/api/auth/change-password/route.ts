import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Verify JWT token from cookie
    const { user, error } = await withAuth(request);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    // Get request body
    const body = await request.json();
    const { senha_atual, nova_senha } = body;

    if (!senha_atual || !nova_senha) {
      return createErrorResponse(
        'Forneça senha_atual e nova_senha',
        400
      );
    }

    if (nova_senha.length < 6) {
      return createErrorResponse(
        'Nova senha deve ter pelo menos 6 caracteres',
        400
      );
    }

    // Get current user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(senha_atual, userData.senha_hash);
    if (!passwordMatch) {
      return createErrorResponse('Senha atual incorreta', 401);
    }

    // Hash new password
    const novasenhaHash = await bcrypt.hash(nova_senha, 10);

    // Update user password
    const { error: updateError } = await supabase
      .from('users')
      .update({
        senha_hash: novasenhaHash,
        senha_temporaria: false, // Mark as non-temporary
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return createErrorResponse('Erro ao atualizar senha', 500);
    }

    return NextResponse.json({
      message: 'Senha alterada com sucesso',
    });
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse(error.message || 'Erro ao alterar senha', 500);
  }
}
