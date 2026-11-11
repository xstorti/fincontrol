import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/types';

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
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !existingUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Prepare updates
    const updates: any = {};

    if (typeof ativo === 'boolean') {
      updates.ativo = ativo;
    }

    if (tipo_usuario && ['admin', 'user'].includes(tipo_usuario)) {
      updates.tipo_usuario = tipo_usuario;
    }

    // Update user
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', parseInt(id));

    if (updateError) {
      console.error('Update error:', updateError);
      return createErrorResponse('Erro ao atualizar usuário', 500);
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

    // Delete user
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
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
