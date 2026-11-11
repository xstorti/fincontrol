import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv, updateCsvRow, deleteCsvRow } from '@/lib/csv';
import { User, ApiResponse } from '@/types';

// PUT - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const { id } = await params;
    const body = await req.json();
    const { ativo, tipo_usuario } = body;

    // Verify user exists
    const users = readCsv<User>('users.csv');
    const existingUser = users.find((u) => u.id === id);

    if (!existingUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Update user
    const updates: Partial<User> = {};

    if (typeof ativo === 'boolean') {
      updates.ativo = ativo;
    }

    if (tipo_usuario && ['admin', 'user'].includes(tipo_usuario)) {
      updates.tipo_usuario = tipo_usuario;
    }

    const updated = updateCsvRow<User>('users.csv', id, updates);

    if (!updated) {
      return createErrorResponse('Erro ao atualizar usuário', 400);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário atualizado com sucesso',
      } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update user error:', error);
    return createErrorResponse('Erro ao atualizar usuário', 500);
  }
}

// DELETE - Delete user
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const { id } = await params;

    // Prevent deleting self
    if (user.id === id) {
      return createErrorResponse('Não pode deletar sua própria conta', 400);
    }

    const deleted = deleteCsvRow<User>('users.csv', id);

    if (!deleted) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Usuário deletado com sucesso',
      } as ApiResponse<null>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete user error:', error);
    return createErrorResponse('Erro ao deletar usuário', 500);
  }
}
