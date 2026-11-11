import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    const { id } = await params;

    // Get transaction from Supabase
    const { data: transaction, error: fetchError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !transaction) {
      return createErrorResponse('Transação não encontrada', 404);
    }

    // Check permissions
    if (transaction.usuario_id !== parseInt(user.id) && user.tipo_usuario !== 'admin') {
      return createErrorResponse('Acesso negado', 403);
    }

    // Delete transaction
    const { error: deleteError } = await supabaseAdmin
      .from('transactions')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
      return createErrorResponse('Erro ao deletar transação', 400);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transação deletada com sucesso',
      } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    return createErrorResponse('Erro ao deletar transação', 500);
  }
}
