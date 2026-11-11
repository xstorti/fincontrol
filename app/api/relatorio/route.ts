import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv } from '@/lib/csv';
import { calculateBalance } from '@/lib/kpi';
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

    // Get transactions
    const transactions = readCsv<Transaction>('transactions.csv');
    let filteredTransactions = transactions.filter((t) => t.usuario_id === user.id && t.tipo === 'despesa');

    // Apply date filters
    if (data_inicio) {
      const startDate = new Date(data_inicio);
      filteredTransactions = filteredTransactions.filter((t) => new Date(t.data) >= startDate);
    }

    if (data_fim) {
      const endDate = new Date(data_fim);
      endDate.setHours(23, 59, 59, 999);
      filteredTransactions = filteredTransactions.filter((t) => new Date(t.data) <= endDate);
    }

    // Sort by date descending
    filteredTransactions.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    const gasto_total = filteredTransactions.reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);
    const saldo_atual = calculateBalance(user.id);

    const report: UserReportData = {
      gasto_total,
      saldo_atual,
      transacoes: filteredTransactions,
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
