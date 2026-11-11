import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { isValidEmail } from '@/lib/utils';
import { EmailConfig, ApiResponse } from '@/types';

// GET - List email recipients
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const { data: emails, error: dbError } = await supabaseAdmin
      .from('email_config')
      .select('*');

    if (dbError) {
      console.error('DB error:', dbError);
      return createErrorResponse('Erro ao listar emails', 500);
    }

    return NextResponse.json(
      {
        success: true,
        data: emails || [],
      } as ApiResponse<EmailConfig[]>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get emails error:', error);
    return createErrorResponse('Erro ao listar emails', 500);
  }
}

// POST - Add email recipient
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { email, notifica_despesa, notifica_credito } = body;

    // Validate input
    if (!email) {
      return createErrorResponse('Email é obrigatório', 400);
    }

    if (!isValidEmail(email)) {
      return createErrorResponse('Email inválido', 400);
    }

    // Check if email already exists
    const { data: existingEmail } = await supabaseAdmin
      .from('email_config')
      .select('email')
      .eq('email', email)
      .single();

    if (existingEmail) {
      return createErrorResponse('Email já cadastrado', 400);
    }

    // Add email to Supabase
    const { data: newEmail, error: insertError } = await supabaseAdmin
      .from('email_config')
      .insert([
        {
          email,
          notifica_despesa: notifica_despesa !== false,
          notifica_credito: notifica_credito !== false,
          ativo: true,
        },
      ])
      .select();

    if (insertError || !newEmail || newEmail.length === 0) {
      console.error('Insert error:', insertError);
      return createErrorResponse('Erro ao adicionar email', 500);
    }

    return NextResponse.json(
      {
        success: true,
        data: newEmail[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add email error:', error);
    return createErrorResponse('Erro ao adicionar email', 500);
  }
}

// PUT - Update email preferences
export async function PUT(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { email, notifica_despesa, notifica_credito } = body;

    if (!email) {
      return createErrorResponse('Email é obrigatório', 400);
    }

    // Prepare updates
    const updates: any = {};

    if (typeof notifica_despesa === 'boolean') {
      updates.notifica_despesa = notifica_despesa;
    }

    if (typeof notifica_credito === 'boolean') {
      updates.notifica_credito = notifica_credito;
    }

    // Update in Supabase
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('email_config')
      .update(updates)
      .eq('email', email)
      .select();

    if (updateError || !updated || updated.length === 0) {
      return createErrorResponse('Email não encontrado', 404);
    }

    return NextResponse.json(
      {
        success: true,
        data: updated[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update email error:', error);
    return createErrorResponse('Erro ao atualizar email', 500);
  }
}

// DELETE - Remove email recipient
export async function DELETE(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return createErrorResponse('Email é obrigatório', 400);
    }

    // Delete from Supabase
    const { error: deleteError, count } = await supabaseAdmin
      .from('email_config')
      .delete()
      .eq('email', email);

    if (deleteError || !count || count === 0) {
      return createErrorResponse('Email não encontrado', 404);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Email removido com sucesso',
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete email error:', error);
    return createErrorResponse('Erro ao remover email', 500);
  }
}
