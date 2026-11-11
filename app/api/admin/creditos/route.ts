import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, getCreditEmailTemplate } from '@/lib/email';
import { User, Credit, ApiResponse } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const body = await req.json();
    const { usuario_id, valor, descricao } = body;

    // Validate input
    if (!usuario_id || !valor || !descricao) {
      return createErrorResponse('usuário_id, valor e descrição são obrigatórios', 400);
    }

    if (typeof valor !== 'number' || valor <= 0) {
      return createErrorResponse('Valor deve ser um número positivo', 400);
    }

    // Get target user
    const { data: targetUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', parseInt(usuario_id))
      .single();

    if (userError || !targetUser) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Get admin user
    const { data: adminUser, error: adminError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', parseInt(user.id))
      .single();

    if (adminError || !adminUser) {
      return createErrorResponse('Admin não encontrado', 404);
    }

    // Create credit in Supabase
    const { data: newCredit, error: insertError } = await supabaseAdmin
      .from('credits')
      .insert([
        {
          usuario_id: parseInt(usuario_id),
          data_creditada: new Date().toISOString().split('T')[0],
          valor,
          descricao,
          admin_que_adicionou: parseInt(user.id),
        },
      ])
      .select();

    if (insertError || !newCredit || newCredit.length === 0) {
      console.error('Insert error:', insertError);
      return createErrorResponse('Erro ao adicionar crédito', 500);
    }

    // Calculate new balance
    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select('valor')
      .eq('usuario_id', parseInt(usuario_id));

    const { data: transactions } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('usuario_id', parseInt(usuario_id))
      .eq('tipo', 'despesa');

    const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalGasto = (transactions || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const saldo_novo = totalCredito - totalGasto;

    // Get email config
    const { data: emailConfig } = await supabaseAdmin
      .from('email_config')
      .select('email')
      .eq('notifica_credito', true)
      .eq('ativo', true);

    const emailDestinarios = [
      targetUser.email,
      ...(emailConfig || []).map((e) => e.email),
    ];

    // Send email notification
    const emailHtml = getCreditEmailTemplate({
      usuario_nome: targetUser.nome,
      valor,
      descricao,
      saldo_novo,
      admin_nome: adminUser.nome,
    });

    await sendEmail({
      to: emailDestinarios,
      subject: `Crédito adicionado: ${descricao}`,
      html: emailHtml,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newCredit[0].id,
          usuario_id: newCredit[0].usuario_id,
          valor: newCredit[0].valor,
          descricao: newCredit[0].descricao,
          data_creditada: newCredit[0].data_creditada,
          admin_que_adicionou: newCredit[0].admin_que_adicionou,
          saldo_novo,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Add credit error:', error);
    return createErrorResponse('Erro ao adicionar crédito', 500);
  }
}
