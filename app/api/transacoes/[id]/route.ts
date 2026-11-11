import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv, deleteCsvRow } from '@/lib/csv';
import { Transaction, ApiResponse } from '@/types';

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

    // Verify transaction exists and belongs to user
    const transactions = readCsv<Transaction>('transactions.csv');
    const transaction = transactions.find((t) => t.id === id);

    if (!transaction) {
      return createErrorResponse('Transação não encontrada', 404);
    }

    // Check permissions
    if (transaction.usuario_id !== user.id && user.tipo_usuario !== 'admin') {
      return createErrorResponse('Acesso negado', 403);
    }

    // Delete transaction
    const deleted = deleteCsvRow<Transaction>('transactions.csv', id);

    if (!deleted) {
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
