'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Transaction } from '@/types';

interface ReportData {
  usuario: User;
  gasto_total: number;
  saldo_atual: number;
  transacoes: Transaction[];
}

export default function RelatoriosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/usuarios');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        return;
      }

      const data = await res.json();
      setUsers(data.data);
      if (data.data.length > 0) {
        setSelectedUserId(data.data[0].id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedUserId) {
      setError('Selecione um usuário');
      return;
    }

    try {
      setError('');
      const params = new URLSearchParams({
        usuario_id: selectedUserId,
      });

      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      const res = await fetch(`/api/admin/relatorio?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao gerar relatório');
        return;
      }

      const data = await res.json();
      setReportData(data.data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleExportCSV = () => {
    if (!reportData) return;

    const csv = [
      ['Relatório FinControl'],
      ['Usuário', reportData.usuario.nome],
      ['Email', reportData.usuario.email],
      ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['Período', `${dataInicio || 'Início'} a ${dataFim || 'Fim'}`],
      ['Gasto Total', `R$ ${reportData.gasto_total.toFixed(2)}`],
      ['Saldo Atual', `R$ ${reportData.saldo_atual.toFixed(2)}`],
      [''],
      ['Data', 'Descrição', 'Valor'],
      ...reportData.transacoes.map((t) => [
        new Date(t.data).toLocaleDateString('pt-BR'),
        t.descricao,
        `R$ ${t.valor.toFixed(2)}`,
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${reportData.usuario.nome.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!reportData) return;

    const json = {
      titulo: 'Relatório FinControl',
      usuario: reportData.usuario,
      periodo: {
        inicio: dataInicio || 'Início',
        fim: dataFim || 'Fim',
      },
      resumo: {
        gasto_total: reportData.gasto_total,
        saldo_atual: reportData.saldo_atual,
        total_transacoes: reportData.transacoes.length,
      },
      transacoes: reportData.transacoes,
      data_geracao: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_${reportData.usuario.nome.replace(/\s+/g, '_')}_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-700">📊 Relatórios</h1>
          <Link href="/admin" className="text-gray-600 hover:text-gray-800">
            ✕
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-bold text-gray-800">Filtros</h3>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                Gerar Relatório
              </button>
            </>
          )}
        </div>

        {/* Report Results */}
        {reportData && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="font-bold text-gray-800">Resumo</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Usuário</p>
                  <p className="font-bold text-gray-800">{reportData.usuario.nome}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Email</p>
                  <p className="font-bold text-gray-800 text-sm break-all">
                    {reportData.usuario.email}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-600 text-sm">Gasto Total</p>
                    <p className="text-2xl font-bold text-red-600">
                      R$ {reportData.gasto_total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Saldo Atual</p>
                    <p
                      className={`text-2xl font-bold ${
                        reportData.saldo_atual >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      R$ {reportData.saldo_atual.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleExportCSV}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  📥 CSV
                </button>
                <button
                  onClick={handleExportJSON}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  📥 JSON
                </button>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">
                Transações ({reportData.transacoes.length})
              </h3>

              {reportData.transacoes.length === 0 ? (
                <p className="text-gray-600 text-sm">Nenhuma transação no período</p>
              ) : (
                <div className="space-y-3">
                  {reportData.transacoes.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div>
                        <p className="font-semibold text-gray-800">{t.descricao}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(t.data).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <p className="font-bold text-red-600">R$ {t.valor.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Back Link */}
        <Link
          href="/admin"
          className="block w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-center transition-colors"
        >
          Voltar
        </Link>
      </main>
    </div>
  );
}
