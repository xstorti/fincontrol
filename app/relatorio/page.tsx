'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Transaction } from '@/types';

interface ReportSummary {
  gasto_total: number;
  saldo_atual: number;
  transacoes: Transaction[];
}

export default function RelatorioPage() {
  const router = useRouter();
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setError('');
      const params = new URLSearchParams();

      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);

      const res = await fetch(`/api/relatorio?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        const data = await res.json();
        setError(data.error || 'Erro ao carregar relatório');
        return;
      }

      const data = await res.json();
      setReport(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setLoading(true);
    loadReport();
  };

  const handleExportCSV = () => {
    if (!report) return;

    const csv = [
      ['Relatório de Gastos FinControl'],
      ['Data do Relatório', new Date().toLocaleDateString('pt-BR')],
      [''],
      ['Período', `${dataInicio || 'Início'} a ${dataFim || 'Fim'}`],
      ['Gasto Total', `R$ ${report.gasto_total.toFixed(2)}`],
      ['Saldo Atual', `R$ ${report.saldo_atual.toFixed(2)}`],
      [''],
      ['Data', 'Descrição', 'Valor'],
      ...report.transacoes.map((t) => [
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
    a.download = `relatorio_gastos_${new Date().getTime()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!report) return;

    const json = {
      titulo: 'Relatório de Gastos',
      periodo: {
        inicio: dataInicio || 'Início',
        fim: dataFim || 'Fim',
      },
      resumo: {
        gasto_total: report.gasto_total,
        saldo_atual: report.saldo_atual,
        total_transacoes: report.transacoes.length,
      },
      transacoes: report.transacoes,
      data_geracao: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio_gastos_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-green-700">📊 Relatório</h1>
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-800">
            ✕
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4 sm:space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-gray-800">Filtrar por Período</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            onClick={handleFilterChange}
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Atualizar
          </button>
        </div>

        {/* Report Summary */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border-t-4 border-red-500">
                <p className="text-gray-600 text-xs font-medium">Gasto Total</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  R$ {report.gasto_total.toFixed(2)}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4 border-t-4 border-green-500">
                <p className="text-gray-600 text-xs font-medium">Saldo Atual</p>
                <p
                  className={`text-2xl font-bold mt-1 ${
                    report.saldo_atual >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  R$ {report.saldo_atual.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📥 Baixar CSV
              </button>
              <button
                onClick={handleExportJSON}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📥 Baixar JSON
              </button>
            </div>

            {/* Transactions List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-bold text-gray-800 mb-4">
                Transações ({report.transacoes.length})
              </h3>

              {report.transacoes.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">
                  Nenhuma transação no período
                </p>
              ) : (
                <div className="space-y-3">
                  {report.transacoes.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
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
        ) : null}

        {/* Back Link */}
        <Link
          href="/dashboard"
          className="block w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-center transition-colors"
        >
          Voltar ao Dashboard
        </Link>
      </main>
    </div>
  );
}
