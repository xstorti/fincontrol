import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado - Admin necessário', 403);
    }

    const body = await req.json();
    const { usuario_id, confirmar } = body;

    if (!confirmar) {
      return createErrorResponse('Confirmação necessária', 400);
    }

    if (!usuario_id) {
      return createErrorResponse('usuario_id é obrigatório', 400);
    }

    // Delete all transactions for the user
    const { error: deleteError, count } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('usuario_id', parseInt(usuario_id));

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return createErrorResponse('Erro ao deletar transações', 500);
    }

    return NextResponse.json(
      {
        success: true,
        message: `✅ ${count} transações deletadas com sucesso`,
        data: { deletadas: count },
      } as ApiResponse<any>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse(error.message || 'Erro ao limpar transações', 500);
  }
}
