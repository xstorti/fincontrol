import { readCsv } from './csv';
import { Transaction, Credit, KPI } from '@/types';

/**
 * Calculate total balance for a user
 * saldo = total_credits - total_expenses
 */
export function calculateBalance(usuario_id: string): number {
  const credits = readCsv<Credit>('credits.csv');
  const transactions = readCsv<Transaction>('transactions.csv');

  const totalCredits = credits
    .filter((c) => c.usuario_id === usuario_id)
    .reduce((sum, c) => sum + parseFloat(c.valor.toString()), 0);

  const totalExpenses = transactions
    .filter((t) => t.usuario_id === usuario_id && t.tipo === 'despesa')
    .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);

  return totalCredits - totalExpenses;
}

/**
 * Calculate KPI for a user in a given period
 */
export function calculateKPI(usuario_id: string, dias: number): KPI {
  const transactions = readCsv<Transaction>('transactions.csv');
  const now = new Date();
  const startDate = new Date(now.getTime() - dias * 24 * 60 * 60 * 1000);

  const periodTransactions = transactions.filter((t) => {
    if (t.usuario_id !== usuario_id || t.tipo !== 'despesa') {
      return false;
    }

    const transDate = new Date(t.data);
    return transDate >= startDate && transDate <= now;
  });

  const gasto_periodo = periodTransactions.reduce(
    (sum, t) => sum + parseFloat(t.valor.toString()),
    0
  );

  const media_dia = dias > 0 ? gasto_periodo / dias : 0;
  const saldo_atual = calculateBalance(usuario_id);

  return {
    saldo_atual,
    gasto_periodo,
    media_dia,
    periodo_dias: dias,
  };
}

/**
 * Get transactions for a user within a period
 */
export function getTransactionsByPeriod(
  usuario_id: string,
  dias: number
): Transaction[] {
  const transactions = readCsv<Transaction>('transactions.csv');
  const now = new Date();
  const startDate = new Date(now.getTime() - dias * 24 * 60 * 60 * 1000);

  return transactions
    .filter((t) => {
      if (t.usuario_id !== usuario_id) {
        return false;
      }

      const transDate = new Date(t.data);
      return transDate >= startDate && transDate <= now;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

/**
 * Get total family stats (for admin dashboard)
 */
export function getFamilyStats(): {
  total_usuarios: number;
  gasto_total_7_dias: number;
  saldo_total: number;
} {
  const users = readCsv<any>('users.csv');
  const transactions = readCsv<Transaction>('transactions.csv');
  const now = new Date();
  const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const gasto_total_7_dias = transactions
    .filter((t) => {
      if (t.tipo !== 'despesa') {
        return false;
      }
      const transDate = new Date(t.data);
      return transDate >= startDate && transDate <= now;
    })
    .reduce((sum, t) => sum + parseFloat(t.valor.toString()), 0);

  let saldo_total = 0;
  users.forEach((user) => {
    saldo_total += calculateBalance(user.id);
  });

  return {
    total_usuarios: users.length,
    gasto_total_7_dias,
    saldo_total,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format date in pt-BR
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}
