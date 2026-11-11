import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, getTransactionEmailTemplate } from '@/lib/email';
import { Transaction, User, ApiResponse } from '@/types';

// GET - List transactions
export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get('usuario_id') || user.id;
    const dias = parseInt(searchParams.get('dias') || '30', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Verify access
    if (usuario_id !== user.id && user.tipo_usuario !== 'admin') {
      return createErrorResponse('Acesso negado', 403);
    }

    // Calculate date range
    const dataFim = new Date();
    const dataInicio = new Date();
    dataInicio.setDate(dataInicio.getDate() - dias);
    const dataInicioStr = dataInicio.toISOString().split('T')[0];

    // Get transactions from Supabase
    const { data: transactions, error: dbError } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('usuario_id', parseInt(usuario_id))
      .gte('data', dataInicioStr)
      .order('data', { ascending: false })
      .limit(limit);

    if (dbError) {
      console.error('Supabase error:', dbError);
      return createErrorResponse('Erro ao obter transações', 500);
    }

    return NextResponse.json(
      {
        success: true,
        data: transactions || [],
      } as ApiResponse<Transaction[]>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get transactions error:', error);
    return createErrorResponse('Erro ao obter transações', 500);
  }
}

// POST - Create transaction
export async function POST(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    const body = await req.json();
    const { data, descricao, valor } = body;

    // Validate input
    if (!data || !descricao || !valor) {
      return createErrorResponse('Data, descrição e valor são obrigatórios', 400);
    }

    if (typeof valor !== 'number' || valor <= 0) {
      return createErrorResponse('Valor deve ser um número positivo', 400);
    }

    // Check if date is not in future
    const txDate = new Date(data);
    const now = new Date();
    if (txDate > now) {
      return createErrorResponse('Data não pode ser no futuro', 400);
    }

    // Get user details from Supabase
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Calculate balance before transaction
    const { data: beforeTx } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('usuario_id', user.id)
      .eq('tipo', 'despesa');

    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select('valor')
      .eq('usuario_id', user.id);

    const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalGasto = (beforeTx || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const saldo_antes = totalCredito - totalGasto;
    const saldo_depois = saldo_antes - valor;

    // Create transaction in Supabase
    const { data: newTransaction, error: insertError } = await supabaseAdmin
      .from('transactions')
      .insert([
        {
          usuario_id: parseInt(user.id),
          data: data,
          descricao: descricao,
          valor: valor,
          tipo: 'despesa',
          email_enviado: false,
        },
      ])
      .select();

    if (insertError || !newTransaction || newTransaction.length === 0) {
      console.error('Insert error:', insertError);
      return createErrorResponse('Erro ao criar transação', 500);
    }

    // Get email config from Supabase
    const { data: emailConfig } = await supabaseAdmin
      .from('email_config')
      .select('email, notifica_despesa, ativo')
      .eq('notifica_despesa', true)
      .eq('ativo', true);

    const emailDestinarios = (emailConfig || []).map((e) => e.email);

    let emailSent = false;
    let emailError = null;

    // Send email notification (if configured)
    if (emailDestinarios.length > 0) {
      const emailHtml = getTransactionEmailTemplate({
        usuario_nome: userData.nome,
        data: data,
        descricao: descricao,
        valor: valor,
        saldo_antes: saldo_antes,
        saldo_depois: saldo_depois,
        gasto_periodo: valor, // Simplified for now
        media_dia: valor, // Simplified for now
        dias: 7,
      });

      console.log('📧 Enviando notificação por email...');
      console.log('Destinatários:', emailDestinarios);
      console.log('API Key configurada:', !!process.env.RESEND_API_KEY);

      const emailResult = await sendEmail({
        to: emailDestinarios,
        subject: `Gasto registrado: ${descricao}`,
        html: emailHtml,
      });

      if (emailResult.success) {
        emailSent = true;
        console.log('✅ Email enviado com sucesso');
      } else {
        emailError = emailResult.error;
        console.log('❌ Erro ao enviar email:', emailError);
      }

      // Update email_enviado flag if successful
      if (emailSent && newTransaction[0].id) {
        await supabaseAdmin
          .from('transactions')
          .update({ email_enviado: true })
          .eq('id', newTransaction[0].id);
      }
    } else {
      console.log('⚠️ Nenhum email configurado para notificações de despesas');
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newTransaction[0],
          saldo_depois,
        },
        email: {
          enviado: emailSent,
          destinatarios: emailDestinarios,
          erro: emailError,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create transaction error:', error);
    return createErrorResponse('Erro ao criar transação', 500);
  }
}

// Helper to convert transactions to CSV
function transactionsToCsv(transactions: Transaction[]): string {
  if (transactions.length === 0) return '';

  const headers = ['id', 'usuario_id', 'data', 'descricao', 'valor', 'tipo', 'criado_em', 'email_enviado'];
  const rows = [
    headers.join(','),
    ...transactions.map((t) =>
      [
        t.id,
        t.usuario_id,
        t.data,
        t.descricao,
        t.valor,
        t.tipo,
        t.criado_em,
        t.email_enviado,
      ]
        .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
        .join(',')
    ),
  ];

  return rows.join('\n');
}
