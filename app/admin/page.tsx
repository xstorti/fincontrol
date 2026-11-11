'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert } from '@/components';
import { User } from '@/types';
import { Users, TrendingUp, Wallet, Mail, BarChart3, ArrowLeft, LogOut, Key } from 'lucide-react';

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
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        setUser(userData.data);

        if (userData.data.tipo_usuario !== 'admin') {
          router.push('/dashboard');
          return;
        }

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
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <p className="text-danger-600 text-lg font-semibold">Acesso negado</p>
          <Link href="/dashboard" className="text-primary-600 mt-4 block font-medium">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-50 via-neutral-50 to-primary-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-neutral-900">FinControl Admin</h1>
            <p className="text-sm text-neutral-600 mt-0.5">Painel de Administração</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/alterar-senha"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            >
              <Key size={18} strokeWidth={2.5} />
              Alterar Senha
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
            >
              <LogOut size={18} strokeWidth={2.5} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Error Alert */}
        {error && <ErrorAlert message="Erro ao carregar dados" details={error} />}

        {/* Welcome Section */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 mb-2">Bem-vindo, {user.nome}! 👋</h2>
          <p className="text-sm sm:text-base text-neutral-600 font-medium">Gerencie sua família e controle financeiro</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-10">
            {/* Total Usuários */}
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-neutral-100 p-4 sm:p-6 hover-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700 uppercase tracking-widest">Total de Usuários</p>
                  <p className="text-3xl sm:text-5xl font-black text-neutral-950 mt-3 sm:mt-4 leading-none" style={{textShadow: '0 0 10px rgba(0,0,0,0.1)'}}>{stats.total_usuarios}</p>
                </div>
                <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition-colors">
                  <Users className="w-8 h-8 text-primary-950" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Gasto 7 dias */}
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-neutral-100 p-4 sm:p-6 hover-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700 uppercase tracking-widest">Gasto (7 dias)</p>
                  <p className="text-3xl sm:text-5xl font-black text-neutral-950 mt-3 sm:mt-4 leading-none" style={{textShadow: '0 0 10px rgba(0,0,0,0.1)'}}>
                    R$ {stats.gasto_total_7_dias.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-danger-100 rounded-xl group-hover:bg-danger-200 transition-colors">
                  <TrendingUp className="w-8 h-8 text-danger-950" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            {/* Saldo Total */}
            <div className="group bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-neutral-100 p-4 sm:p-6 hover-lift">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-700 uppercase tracking-widest">Saldo Total</p>
                  <p className={`text-3xl sm:text-5xl font-black mt-3 sm:mt-4 leading-none ${
                    stats.saldo_total >= 0 ? 'text-neutral-950' : 'text-neutral-950'
                  }`} style={{textShadow: '0 0 10px rgba(0,0,0,0.1)'}}>
                    R$ {stats.saldo_total.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl transition-colors ${
                  stats.saldo_total >= 0 
                    ? 'bg-success-100 group-hover:bg-success-200' 
                    : 'bg-danger-100 group-hover:bg-danger-200'
                }`}>
                  <Wallet className="w-10 h-10 text-black" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin Menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {/* Usuários */}
          <Link
            href="/admin/usuarios"
            className="group block p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-lg border border-neutral-100 hover:border-primary-200 transition-all hover-lift"
          >
            <div className="p-3 bg-primary-100 rounded-lg w-fit mb-4 group-hover:bg-primary-200 transition-colors">
              <Users className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-neutral-950 mb-1 text-lg">Usuários</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">Criar, editar, ativar/desativar</p>
          </Link>

          {/* Créditos */}
          <Link
            href="/admin/creditos"
            className="group block p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-lg border border-neutral-100 hover:border-success-200 transition-all hover-lift"
          >
            <div className="p-3 bg-success-100 rounded-lg w-fit mb-4 group-hover:bg-success-200 transition-colors">
              <Wallet className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-neutral-950 mb-1 text-lg">Créditos</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">Adicionar saldo para usuários</p>
          </Link>

          {/* Notificações */}
          <Link
            href="/admin/emails"
            className="group block p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-lg border border-neutral-100 hover:border-secondary-200 transition-all hover-lift"
          >
            <div className="p-3 bg-secondary-100 rounded-lg w-fit mb-4 group-hover:bg-secondary-200 transition-colors">
              <Mail className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-neutral-950 mb-1 text-lg">Notificações</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">Configurar notificações por email</p>
          </Link>

          {/* Relatórios */}
          <Link
            href="/admin/relatorios"
            className="group block p-4 sm:p-6 bg-white rounded-xl shadow-sm hover:shadow-lg border border-neutral-100 hover:border-warning-200 transition-all hover-lift"
          >
            <div className="p-3 bg-warning-100 rounded-lg w-fit mb-4 group-hover:bg-warning-200 transition-colors">
              <BarChart3 className="w-10 h-10 text-black" strokeWidth={2.5} />
            </div>
            <h3 className="font-black text-neutral-950 mb-1 text-lg">Relatórios</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">Visualizar e exportar dados</p>
          </Link>
        </div>

        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-600 hover:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-300 hover-lift"
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          Voltar ao Dashboard
        </Link>
      </main>
    </div>
  );
}
