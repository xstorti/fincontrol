import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse, Credit } from '@/types';

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
    const { valor, descricao } = body;

    // Validate input
    if (valor !== undefined && typeof valor !== 'number') {
      return createErrorResponse('Valor deve ser um número', 400);
    }

    if (valor !== undefined && valor <= 0) {
      return createErrorResponse('Valor deve ser positivo', 400);
    }

    if (descricao !== undefined && typeof descricao !== 'string') {
      return createErrorResponse('Descrição deve ser texto', 400);
    }

    // Get current credit
    const { data: currentCredit, error: fetchError } = await supabaseAdmin
      .from('credits')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !currentCredit) {
      return createErrorResponse('Crédito não encontrado', 404);
    }

    // Update credit
    const updateData: any = {};
    if (valor !== undefined) updateData.valor = valor;
    if (descricao !== undefined) updateData.descricao = descricao;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('credits')
      .update(updateData)
      .eq('id', parseInt(id))
      .select()
      .single();

    if (updateError || !updated) {
      console.error('Update error:', updateError);
      return createErrorResponse('Erro ao atualizar crédito', 500);
    }

    const response: ApiResponse<Credit> = {
      success: true,
      data: updated,
      message: 'Crédito atualizado com sucesso',
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error:', err);
    return createErrorResponse(err.message || 'Erro ao atualizar crédito', 500);
  }
}

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

    // Check if credit exists
    const { data: credit, error: fetchError } = await supabaseAdmin
      .from('credits')
      .select('*')
      .eq('id', parseInt(id))
      .single();

    if (fetchError || !credit) {
      return createErrorResponse('Crédito não encontrado', 404);
    }

    // Delete credit
    const { error: deleteError } = await supabaseAdmin
      .from('credits')
      .delete()
      .eq('id', parseInt(id));

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return createErrorResponse('Erro ao deletar crédito', 500);
    }

    const response: ApiResponse<null> = {
      success: true,
      message: 'Crédito deletado com sucesso',
    };

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Error:', err);
    return createErrorResponse(err.message || 'Erro ao deletar crédito', 500);
  }
}
