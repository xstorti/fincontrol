'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert } from '@/components';
import { User } from '@/types';

interface FamilyStats {
  total_usuarios: number;
  gasto_total_7_dias: number;
  saldo_total: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData.data);

        // Check if admin
        if (userData.data.tipo_usuario !== 'admin') {
          router.push('/dashboard');
          return;
        }

        // Get family stats
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user || user.tipo_usuario !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold">Acesso negado</p>
          <Link href="/dashboard" className="text-blue-600 mt-4 block">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-700">⚙️ Painel Admin</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Error Alert */}
        {error && <ErrorAlert message="Erro ao carregar dados" details={error} />}

        {/* Welcome */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">Bem-vindo, {user.nome}! 👋</h2>
          <p className="text-gray-600 text-sm mt-1">Gerencie sua família e controle financeiro</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Usuários */}
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-blue-500">
              <p className="text-gray-600 text-sm font-medium">Total de Usuários</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.total_usuarios}</p>
            </div>

            {/* Gasto 7 dias */}
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-red-500">
              <p className="text-gray-600 text-sm font-medium">Gasto (7 dias)</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                R$ {stats.gasto_total_7_dias.toFixed(2)}
              </p>
            </div>

            {/* Saldo Total */}
            <div className="bg-white rounded-lg shadow p-6 border-t-4 border-green-500">
              <p className="text-gray-600 text-sm font-medium">Saldo Total</p>
              <p
                className={`text-3xl font-bold mt-2 ${
                  stats.saldo_total >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                R$ {stats.saldo_total.toFixed(2)}
              </p>
            </div>
          </div>
        )}

        {/* Admin Menu */}
        <div className="grid grid-cols-2 gap-4">
          {/* Usuários */}
          <Link
            href="/admin/usuarios"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-blue-500"
          >
            <div className="text-2xl mb-2">👥</div>
            <h3 className="font-bold text-gray-800">Usuários</h3>
            <p className="text-xs text-gray-600 mt-1">Criar, editar, ativar/desativar</p>
          </Link>

          {/* Créditos */}
          <Link
            href="/admin/creditos"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-green-500"
          >
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-bold text-gray-800">Créditos</h3>
            <p className="text-xs text-gray-600 mt-1">Adicionar saldo para usuários</p>
          </Link>

          {/* Emails */}
          <Link
            href="/admin/emails"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-orange-500"
          >
            <div className="text-2xl mb-2">📧</div>
            <h3 className="font-bold text-gray-800">Notificações</h3>
            <p className="text-xs text-gray-600 mt-1">Configurar destinatários de email</p>
          </Link>

          {/* Relatórios */}
          <Link
            href="/admin/relatorios"
            className="block p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow border-l-4 border-purple-500"
          >
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-bold text-gray-800">Relatórios</h3>
            <p className="text-xs text-gray-600 mt-1">Visualizar e exportar dados</p>
          </Link>
        </div>

        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="block w-full py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-center transition-colors"
        >
          ← Voltar ao Dashboard
        </Link>
      </main>
    </div>
  );
}
