'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert, SkeletonList, ThemeToggle } from '@/components';
import { KPI, Transaction, User } from '@/types';
import { Plus, TrendingDown, TrendingUp, BarChart3, Settings, LogOut } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dias, setDias] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData.data);

        // Get KPI
        const kpiRes = await fetch(`/api/saldo?dias=${dias}`);
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpi(kpiData.data);
        }

        // Get transactions
        const txRes = await fetch(`/api/transacoes?dias=${dias}&limit=10`);
        if (txRes.ok) {
          const txData = await txRes.json();
          setTransactions(txData.data);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, dias]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-lg">
              💰
            </div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">FinControl</h1>
          </div>
          
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
              aria-label="Sair"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-8">
        {/* Error Alert */}
        {error && <ErrorAlert message="Erro ao carregar dados" details={error} />}

        {/* Welcome Section */}
        <div className="space-y-2">
          <p className="text-neutral-600 dark:text-neutral-400">Bem-vindo</p>
          <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
            Olá, {user?.nome}! 👋
          </h2>
        </div>

        {/* KPI Cards Section */}
        {kpi && (
          <div className="space-y-6">
            {/* Main Balance Card */}
            <div className="bg-linear-to-br from-primary-500 to-primary-700 dark:from-primary-600 dark:to-primary-800 rounded-2xl shadow-lg p-8 text-white">
              <p className="text-primary-100 text-sm font-medium mb-2">Saldo Atual</p>
              <p className="text-5xl font-bold mb-4">
                R$ {Math.abs(kpi.saldo_atual).toFixed(2)}
              </p>
              <p className="text-primary-100 text-sm">
                {kpi.saldo_atual >= 0 ? '✓ Saldo positivo' : '⚠ Saldo em débito'}
              </p>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
                Período de Análise
              </label>
              <select
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={14}>Últimos 14 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
              </select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Expenses */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-danger-100 dark:bg-danger-900/30 rounded-lg flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-danger-600 dark:text-danger-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Despesa Total</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">{dias} dias</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-danger-600 dark:text-danger-500">
                  R$ {kpi.gasto_periodo.toFixed(2)}
                </p>
              </div>

              {/* Average per day */}
              <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-warning-100 dark:bg-warning-900/30 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-warning-600 dark:text-warning-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Média Diária</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-500">por dia</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-warning-600 dark:text-warning-500">
                  R$ {kpi.media_dia.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        <Link
          href="/adicionar-gasto"
          className="flex w-full py-4 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl items-center justify-center gap-2"
        >
          <Plus size={20} />
          Adicionar Despesa
        </Link>

        {/* Transactions Section */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Últimas Transações
          </h3>

          {transactions.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-8 text-center">
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">Nenhuma transação no período</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white dark:bg-neutral-800 rounded-lg shadow-sm border border-neutral-200 dark:border-neutral-700 p-4 flex items-center justify-between hover:shadow-md dark:hover:shadow-dark-md transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 truncate">{tx.descricao}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                      {new Date(tx.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-lg font-semibold text-danger-600 dark:text-danger-500 ml-4 shrink-0">
                    -R$ {tx.valor.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Link
            href="/relatorio"
            className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-primary-600 dark:text-primary-500 font-semibold rounded-lg transition-colors"
          >
            <BarChart3 size={20} />
            <span>Relatório</span>
          </Link>
          {user?.tipo_usuario === 'admin' && (
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 py-4 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 text-secondary-600 dark:text-secondary-500 font-semibold rounded-lg transition-colors"
            >
              <Settings size={20} />
              <span>Painel Admin</span>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
