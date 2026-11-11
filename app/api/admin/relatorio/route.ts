import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, createErrorResponse } from '@/lib/middleware';
import { readCsv } from '@/lib/csv';
import { calculateBalance, getTransactionsByPeriod } from '@/lib/kpi';
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

    // Get user
    const users = readCsv<User>('users.csv');
    const usuario = users.find((u) => u.id === usuario_id);

    if (!usuario) {
      return createErrorResponse('Usuário não encontrado', 404);
    }

    // Get transactions
    const transactions = readCsv<Transaction>('transactions.csv');
    let filteredTransactions = transactions.filter((t) => t.usuario_id === usuario_id && t.tipo === 'despesa');

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
    const saldo_atual = calculateBalance(usuario_id);

    const report: AdminReportData = {
      usuario,
      gasto_total,
      saldo_atual,
      transacoes: filteredTransactions,
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
