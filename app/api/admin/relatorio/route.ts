import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { User, Transaction, ApiResponse } from '@/types';

interface AdminReportData {
  usuario: User;
  gasto_total: number;
  saldo_atual: number;
  transacoes: Transaction[];
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAdminAuth(req);

    if (!user || error) {
      return createErrorResponse('Acesso negado', 403);
    }

    const { searchParams } = new URL(req.url);
    const usuario_id = searchParams.get('usuario_id');
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');

    if (!usuario_id) {
      return createErrorResponse('usuario_id é obrigatório', 400);
    }

    // Get user from Supabase
    const { data: usuario, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', parseInt(usuario_id))
      .single();

    if (userError || !usuario) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Build query for transactions
    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('usuario_id', parseInt(usuario_id))
      .eq('tipo', 'despesa')
      .order('data', { ascending: false });

    // Apply date filters if provided
    if (data_inicio) {
      query = query.gte('data', data_inicio);
    }

    if (data_fim) {
      query = query.lte('data', data_fim);
    }

    const { data: filteredTransactions, error: transError } = await query;

    if (transError) {
      return createErrorResponse('Erro ao gerar relatório', 500);
    }

    // Calculate balance
    const { data: credits } = await supabaseAdmin
      .from('credits')
      .select('valor')
      .eq('usuario_id', parseInt(usuario_id));

    const { data: allExpenses } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('usuario_id', parseInt(usuario_id))
      .eq('tipo', 'despesa');

    const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalGasto = (allExpenses || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const saldo_atual = totalCredito - totalGasto;

    const gasto_total = (filteredTransactions || []).reduce((sum, t) => sum + (t.valor || 0), 0);

    const report: AdminReportData = {
      usuario,
      gasto_total,
      saldo_atual,
      transacoes: filteredTransactions || [],
    };

    return NextResponse.json(
      {
        success: true,
        data: report,
      } as ApiResponse<AdminReportData>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get admin report error:', error);
    return createErrorResponse('Erro ao gerar relatório', 500);
  }
}
