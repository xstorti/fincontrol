import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { supabaseAdmin } from '@/lib/supabase';
import { Transaction, ApiResponse } from '@/types';

interface UserReportData {
  gasto_total: number;
  saldo_atual: number;
  transacoes: Transaction[];
}

export async function GET(req: NextRequest) {
  try {
    const { user, error } = await withAuth(req);

    if (!user || error) {
      return createErrorResponse('Não autenticado', 401);
    }

    const { searchParams } = new URL(req.url);
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');

    // Build query for transactions
    let query = supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('usuario_id', user.id)
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
      .eq('usuario_id', user.id);

    const { data: allExpenses } = await supabaseAdmin
      .from('transactions')
      .select('valor')
      .eq('usuario_id', user.id)
      .eq('tipo', 'despesa');

    const totalCredito = (credits || []).reduce((sum, c) => sum + (c.valor || 0), 0);
    const totalGasto = (allExpenses || []).reduce((sum, t) => sum + (t.valor || 0), 0);
    const saldo_atual = totalCredito - totalGasto;

    const gasto_total = (filteredTransactions || []).reduce((sum, t) => sum + (t.valor || 0), 0);

    const report: UserReportData = {
      gasto_total,
      saldo_atual,
      transacoes: filteredTransactions || [],
    };

    return NextResponse.json(
      {
        success: true,
        data: report,
      } as ApiResponse<UserReportData>,
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get report error:', error);
    return createErrorResponse('Erro ao gerar relatório', 500);
  }
}
