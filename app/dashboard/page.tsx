'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert, SkeletonList } from '@/components';
import { KPI, Transaction, User } from '@/types';

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-700">💰 FinControl</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-6">
        {/* Error Alert */}
        {error && <ErrorAlert message="Erro ao carregar dados" details={error} />}

        {/* Welcome Message */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Olá, {user?.nome}! 👋</h2>
        </div>

        {/* KPI Cards */}
        {kpi && (
          <div className="space-y-4">
            {/* Saldo Card */}
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <p className="text-gray-600 text-sm font-medium mb-2">Saldo Atual</p>
              <p
                className={`text-3xl font-bold ${
                  kpi.saldo_atual >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                R$ {kpi.saldo_atual.toFixed(2)}
              </p>
            </div>

            {/* Period Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período (dias)
              </label>
              <select
                value={dias}
                onChange={(e) => setDias(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
              </select>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-2 gap-4">
              {/* Gasto */}
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600 text-xs font-medium mb-1">Gasto</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {kpi.gasto_periodo.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">{dias} dias</p>
              </div>

              {/* Média/dia */}
              <div className="bg-white rounded-lg shadow p-4">
                <p className="text-gray-600 text-xs font-medium mb-1">Média/dia</p>
                <p className="text-2xl font-bold text-orange-600">
                  R$ {kpi.media_dia.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">por dia</p>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Button */}
        <Link
          href="/adicionar-gasto"
          className="block w-full py-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg text-center transition-colors shadow-lg"
        >
          + Adicionar Gasto
        </Link>

        {/* Transactions List */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Últimas Transações</h3>

          {transactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600 text-sm">Nenhuma transação ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="bg-white rounded-lg shadow p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{tx.descricao}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(tx.data).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-red-600">
                    -R$ {tx.valor.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-2 gap-4 py-4">
          <Link
            href="/relatorio"
            className="block py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-center text-sm transition-colors"
          >
            📊 Relatório
          </Link>
          {user?.tipo_usuario === 'admin' && (
            <Link
              href="/admin"
              className="block py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg text-center text-sm transition-colors"
            >
              ⚙️ Admin
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
