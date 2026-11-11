'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert, SkeletonList } from '@/components';
import { KPI, Transaction, User } from '@/types';
import { Plus, TrendingDown, TrendingUp, BarChart3, Settings, LogOut, ArrowRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

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
          <p className="text-neutral-400 font-medium text-xs sm:text-sm">Bem-vindo de volta</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">
            Olá, {user?.nome}! 👋
          </h2>
        </div>

        {/* KPI Cards Section */}
        {kpi && (
          <div className="space-y-4 sm:space-y-6 lg:space-y-6">
            {/* Main Balance Card - Premium */}
            <div className="group relative">
              <div className={`absolute inset-0 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                kpi.saldo_atual >= 0 
                  ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20'
                  : 'bg-gradient-to-r from-red-500/20 to-rose-500/20'
              }`}></div>
              <div className={`relative rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 text-white border transition-all duration-300 ${
                kpi.saldo_atual >= 0
                  ? 'bg-gradient-to-br from-emerald-600 to-green-800 dark:from-emerald-700 dark:to-green-900 border-emerald-500/20'
                  : 'bg-gradient-to-br from-red-600 to-rose-800 dark:from-red-700 dark:to-rose-900 border-red-500/20'
              }`}>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-wide mb-2 ${
                      kpi.saldo_atual >= 0 ? 'text-emerald-100' : 'text-red-100'
                    }`}>Saldo Atual</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-black">
                      R$ {Math.abs(kpi.saldo_atual).toFixed(2)}
                    </p>
                    {kpi.variacao_percentual !== undefined && (
                      <div className="mt-3 flex items-center gap-2">
                        {kpi.variacao_percentual > 0 ? (
                          <>
                            <TrendingDown className="w-4 h-4" />
                            <span className="text-sm font-semibold">+{kpi.variacao_percentual.toFixed(1)}% vs período anterior</span>
                          </>
                        ) : kpi.variacao_percentual < 0 ? (
                          <>
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-sm font-semibold">{kpi.variacao_percentual.toFixed(1)}% vs período anterior</span>
                          </>
                        ) : (
                          <span className="text-sm font-semibold">Sem variação</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-3xl">{kpi.saldo_atual >= 0 ? '💚' : '📉'}</div>
                </div>

                {/* Sparkline */}
                {kpi.historico_diario && kpi.historico_diario.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-white/20">
                    <ResponsiveContainer width="100%" height={40}>
                      <LineChart data={kpi.historico_diario}>
                        <Line 
                          type="monotone" 
                          dataKey="valor" 
                          stroke="currentColor"
                          strokeWidth={2}
                          dot={false} 
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className={`flex items-center gap-2 mt-6 text-sm font-medium ${
                  kpi.saldo_atual >= 0 ? 'text-emerald-100' : 'text-red-100'
                }`}>
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

            {/* Receitas Card - If there are credits */}
            {kpi.credito_total && kpi.credito_total > 0 && (
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-green-600 to-emerald-800 dark:from-green-700 dark:to-emerald-900 rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-8 text-white border border-green-500/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-300" strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-100">Receita Total</p>
                      <p className="text-xs text-green-200">Créditos acumulados</p>
                    </div>
                  </div>
                  <p className="text-3xl sm:text-4xl font-black text-green-300">
                    R$ {kpi.credito_total.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

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
              <div className="group bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 hover:border-red-500/50 p-4 sm:p-5 lg:p-6 transition-all duration-300 hover-lift">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-500/10 group-hover:bg-red-500/20 rounded-lg transition-colors">
                    <TrendingDown className="w-6 h-6 text-red-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Despesa Total</p>
                    <p className="text-xs text-neutral-500">{dias} dias</p>
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: '#EF4444' }}>
                  R$ {kpi.gasto_periodo.toFixed(2)}
                </p>
              </div>

              {/* Average per day */}
              <div className="group bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 hover:border-amber-500/50 p-4 sm:p-5 lg:p-6 transition-all duration-300 hover-lift">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-amber-500/10 group-hover:bg-amber-500/20 rounded-lg transition-colors">
                    <BarChart3 className="w-6 h-6 text-amber-400" strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">Média Diária</p>
                    <p className="text-xs text-neutral-500">por dia</p>
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-amber-400">
                  R$ {kpi.media_dia.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        <Link
          href="/adicionar-gasto"
          className="group flex w-full py-3 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 text-white font-bold text-sm sm:text-base rounded-xl transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 items-center justify-center gap-3 hover-lift"
        >
          <Plus size={20} strokeWidth={2.5} className="transition-transform group-hover:scale-110" />
          <span>Adicionar Despesa</span>
          <ArrowRight size={18} strokeWidth={2.5} className="opacity-0 -ml-2 transition-all group-hover:opacity-100 group-hover:ml-0" />
        </Link>

        {/* Transactions Section */}
        <div className="space-y-4">
          <h3 className="text-lg sm:text-xl font-black text-white">
            Últimas Transações
          </h3>

          {transactions.length === 0 ? (
            <div className="bg-neutral-800/50 backdrop-blur-sm rounded-2xl border border-neutral-700/50 p-6 sm:p-12 text-center">
              <p className="text-neutral-400 font-medium text-sm sm:text-base">Nenhuma transação no período</p>
              <p className="text-neutral-500 text-xs sm:text-sm mt-2">Adicione uma despesa para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="group bg-neutral-800/50 dark:bg-neutral-800/50 backdrop-blur-sm rounded-xl border border-neutral-700/50 hover:border-primary-500/50 p-3 sm:p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/10 hover-lift"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-neutral-100 text-sm sm:text-base truncate group-hover:text-white transition-colors">{tx.descricao}</p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {new Date(tx.data).toLocaleDateString('pt-BR', { 
                        month: 'short', 
                        day: 'numeric',
                        year: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <p className="text-base sm:text-lg font-black text-danger-400">
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
            <BarChart3 size={20} strokeWidth={2.5} />
            <span>Relatório</span>
          </Link>
          {user?.tipo_usuario === 'admin' && (
            <Link
              href="/admin"
              className="group flex items-center justify-center gap-2 py-4 px-6 bg-neutral-800/50 hover:bg-neutral-700/50 border border-neutral-700/50 hover:border-secondary-500/50 text-secondary-400 hover:text-secondary-300 font-bold rounded-xl transition-all duration-300 hover-lift"
            >
              <Settings size={20} strokeWidth={2.5} />
              <span>Painel Admin</span>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
