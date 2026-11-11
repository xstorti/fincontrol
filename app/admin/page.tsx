'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingSpinner, ErrorAlert } from '@/components';
import { User } from '@/types';
import { Users, TrendingUp, Wallet, Mail, BarChart3, ArrowLeft, LogOut, Key } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';

interface FamilyStats {
  total_usuarios: number;
  gasto_total_7_dias: number;
  saldo_total: number;
}

interface DespesasData {
  acumuladas: Array<{ usuario_id: string; nome: string; total: number }>;
  dia: Array<{ usuario_id: string; nome: string; total: number }>;
}

// Cores para os gráficos
const COLORS = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<FamilyStats | null>(null);
  const [despesas, setDespesas] = useState<DespesasData | null>(null);
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

        const [statsRes, despesasRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/stats/despesas'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (despesasRes.ok) {
          const despesasData = await despesasRes.json();
          setDespesas(despesasData.data);
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

        {/* Gráficos de Despesas */}
        {despesas && (
          <div className="space-y-8 mb-8 sm:mb-10">
            {/* Gráfico Despesas Acumuladas */}
            {despesas.acumuladas.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-neutral-100 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-6">
                  📊 Despesas Acumuladas por Usuário
                </h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={despesas.acumuladas.map((d) => ({
                          name: d.nome,
                          value: parseFloat(d.total.toFixed(2)),
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${((value / despesas.acumuladas.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {despesas.acumuladas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `R$ ${typeof value === 'number' ? value.toFixed(2) : parseFloat(String(value || 0)).toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: '#000000',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-700 font-medium">
                    Total Acumulado: <span className="text-danger-600 font-black">R$ {despesas.acumuladas.reduce((sum, d) => sum + d.total, 0).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Gráfico Despesas do Dia */}
            {despesas.dia.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all border border-neutral-100 p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-black text-neutral-900 mb-6">
                  📈 Despesas do Dia por Usuário
                </h3>
                <div className="w-full h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={despesas.dia.map((d) => ({
                          name: d.nome,
                          value: parseFloat(d.total.toFixed(2)),
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${((value / despesas.dia.reduce((sum, d) => sum + d.total, 0)) * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {despesas.dia.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => `R$ ${typeof value === 'number' ? value.toFixed(2) : parseFloat(String(value || 0)).toFixed(2)}`}
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          color: '#000000',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <p className="text-sm text-neutral-700 font-medium">
                    Total do Dia: <span className="text-danger-600 font-black">R$ {despesas.dia.reduce((sum, d) => sum + d.total, 0).toFixed(2)}</span>
                  </p>
                </div>
              </div>
            )}
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
