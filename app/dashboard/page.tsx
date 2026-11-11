'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert, SkeletonList } from '@/components';
import { KPI, Transaction, User } from '@/types';
import { Plus, TrendingDown, TrendingUp, BarChart3, Settings, LogOut, ArrowRight } from 'lucide-react';

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
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData.data);

        const kpiRes = await fetch(`/api/saldo?dias=${dias}`);
        if (kpiRes.ok) {
          const kpiData = await kpiRes.json();
          setKpi(kpiData.data);
        }

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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-800">
      {/* Background gradient elements */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-secondary-500/5 rounded-full blur-3xl -z-10"></div>

      {/* Header */}
      <header className="bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-xl border-b border-neutral-700/50 sticky top-0 z-20 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-lg shadow-lg shadow-primary-500/30">
              💰
            </div>
            <div>
              <h1 className="text-lg font-black text-white">FinControl</h1>
              <p className="text-xs text-neutral-400">Controle Financeiro</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-lg bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 hover:text-white transition-all duration-300"
            aria-label="Sair"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Error Alert */}
        {error && <ErrorAlert message="Erro ao carregar dados" details={error} />}

        {/* Welcome Section */}
        <div className="space-y-2 animate-blur-in">
          <p className="text-neutral-400 font-medium text-sm">Bem-vindo de volta</p>
          <h2 className="text-4xl font-black text-white">
            Olá, {user?.nome}! 👋
          </h2>
        </div>

        {/* KPI Cards Section */}
        {kpi && (
          <div className="space-y-6">
            {/* Main Balance Card - Premium */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-primary-600 to-primary-800 dark:from-primary-700 dark:to-primary-900 rounded-3xl shadow-2xl p-8 text-white border border-primary-500/20">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-primary-100 text-sm font-bold uppercase tracking-wide mb-2">Saldo Atual</p>
                    <p className="text-5xl font-black">
                      R$ {Math.abs(kpi.saldo_atual).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-3xl">💳</div>
                </div>
                <div className="flex items-center gap-2 text-primary-100 text-sm font-medium">
                  {kpi.saldo_atual >= 0 ? (
                    <>
                      <TrendingUp size={16} />
                      Saldo positivo
                    </>
                  ) : (
                    <>
                      <TrendingDown size={16} />
                      Saldo em débito
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 p-4">
              <label className="block text-xs font-bold uppercase tracking-wide text-neutral-400 mb-3">
                Período de Análise
              </label>
              <select
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500/50 focus:border-primary-500/50 text-neutral-100 placeholder-neutral-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
              >
                <option value={7}>Últimos 7 dias</option>
                <option value={14}>Últimos 14 dias</option>
                <option value={30}>Últimos 30 dias</option>
                <option value={60}>Últimos 60 dias</option>
              </select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expenses */}
              <div className="group bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 hover:border-danger-500/50 p-6 transition-all duration-300 hover-lift">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-danger-500/10 rounded-lg group-hover:bg-danger-500/20 transition-colors">
                    <TrendingDown className="w-6 h-6 text-danger-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Despesa Total</p>
                    <p className="text-xs text-neutral-500">{dias} dias</p>
                  </div>
                </div>
                <p className="text-3xl font-black text-danger-400">
                  R$ {kpi.gasto_periodo.toFixed(2)}
                </p>
              </div>

              {/* Average per day */}
              <div className="group bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 hover:border-warning-500/50 p-6 transition-all duration-300 hover-lift">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-warning-500/10 rounded-lg group-hover:bg-warning-500/20 transition-colors">
                    <BarChart3 className="w-6 h-6 text-warning-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Média Diária</p>
                    <p className="text-xs text-neutral-500">por dia</p>
                  </div>
                </div>
                <p className="text-3xl font-black text-warning-400">
                  R$ {kpi.media_dia.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        <Link
          href="/adicionar-gasto"
          className="group flex w-full py-4 px-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 items-center justify-center gap-3 hover-lift"
        >
          <Plus size={20} className="transition-transform group-hover:scale-110" />
          <span>Adicionar Despesa</span>
          <ArrowRight size={18} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
        </Link>

        {/* Transactions Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white">
            Últimas Transações
          </h3>

          {transactions.length === 0 ? (
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 p-12 text-center">
              <p className="text-neutral-400 font-medium">Nenhuma transação no período</p>
              <p className="text-neutral-500 text-sm mt-2">Adicione uma despesa para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-primary-500/50 p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 hover-lift"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-100 truncate group-hover:text-white transition-colors">{tx.descricao}</p>
                    <p className="text-xs text-neutral-500 mt-1.5">
                      {new Date(tx.data).toLocaleDateString('pt-BR', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-lg font-black text-danger-400">
                      -R$ {tx.valor.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-8">
          <Link
            href="/relatorio"
            className="group flex items-center justify-center gap-2 py-4 px-6 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 hover:border-primary-500/50 text-primary-400 hover:text-primary-300 font-bold rounded-xl transition-all duration-300 hover-lift"
          >
            <BarChart3 size={20} />
            <span>Relatório</span>
          </Link>
          {user?.tipo_usuario === 'admin' && (
            <Link
              href="/admin"
              className="group flex items-center justify-center gap-2 py-4 px-6 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 hover:border-secondary-500/50 text-secondary-400 hover:text-secondary-300 font-bold rounded-xl transition-all duration-300 hover-lift"
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
