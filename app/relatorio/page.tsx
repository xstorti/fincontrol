'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

  const handleExportPDF = async () => {
    if (!report) return;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      let position = 15;

      // Título
      pdf.setFontSize(18);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Relatório FinControl', pdfWidth / 2, position, { align: 'center' });

      position += 8;
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pdfWidth / 2, position, { align: 'center' });

      position += 12;

      // Seção Resumo
      pdf.setFontSize(12);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Resumo', 15, position);

      position += 8;
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`Gasto Total: R$ ${report.gasto_total.toFixed(2)}`, 15, position);
      position += 6;
      pdf.text(`Saldo Atual: R$ ${report.saldo_atual.toFixed(2)}`, 15, position);

      position += 10;

      // Seção Transações
      if (report.transacoes.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Transações', 15, position);

        position += 8;

        // Cabeçalho da tabela
        pdf.setFontSize(10);
        pdf.setFont('Helvetica', 'bold');
        pdf.text('Data', 15, position);
        pdf.text('Descrição', 40, position);
        pdf.text('Valor', 180, position, { align: 'right' });

        position += 6;
        pdf.line(15, position - 2, 200, position - 2); // Linha horizontal

        position += 2;
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);

        // Agrupar transações por dia
        const transacoesPorDia: { [key: string]: typeof report.transacoes } = {};
        report.transacoes.forEach(t => {
          const data = new Date(t.data).toLocaleDateString('pt-BR');
          if (!transacoesPorDia[data]) transacoesPorDia[data] = [];
          transacoesPorDia[data].push(t);
        });

        let totalPorDia = 0;
        Object.keys(transacoesPorDia).sort().forEach((data, idx) => {
          const transacoes = transacoesPorDia[data];
          const totalDia = transacoes.reduce((sum, t) => sum + t.valor, 0);
          totalPorDia += totalDia;

          // Transações do dia
          transacoes.forEach((t, i) => {
            if (position > pdfHeight - 15) {
              pdf.addPage();
              position = 15;
            }

            const dataAtual = i === 0 ? data : '';
            pdf.text(dataAtual, 15, position);
            
            // Quebra de linha para descrições longas
            const descricao = t.descricao.substring(0, 40);
            pdf.text(descricao, 40, position);
            pdf.text(`R$ ${t.valor.toFixed(2)}`, 180, position, { align: 'right' });

            position += 5;
          });

          // Subtotal do dia
          if (position > pdfHeight - 15) {
            pdf.addPage();
            position = 15;
          }

          pdf.setFont('Helvetica', 'bold');
          pdf.text(`Total do dia (${data}):`, 40, position);
          pdf.text(`R$ ${totalDia.toFixed(2)}`, 180, position, { align: 'right' });
          pdf.setFont('Helvetica', 'normal');

          position += 7;
          pdf.line(15, position - 2, 200, position - 2);
          position += 1;
        });

        // Total geral
        position += 3;
        if (position > pdfHeight - 15) {
          pdf.addPage();
          position = 15;
        }

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text('Total Geral:', 40, position);
        pdf.text(`R$ ${report.gasto_total.toFixed(2)}`, 180, position, { align: 'right' });
      }

      pdf.save(`relatorio_gastos_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">📊 Relatório</h1>
          <Link href="/dashboard" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
            ✕
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-4 sm:space-y-6">
        {error && (
          <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700/50 rounded-lg">
            <p className="text-danger-700 dark:text-danger-600 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-4 sm:p-6 space-y-4">
          <h3 className="font-bold text-sm sm:text-base text-neutral-900 dark:text-neutral-100">Filtrar por Período</h3>

          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Data Início</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Data Fim</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            onClick={handleFilterChange}
            className="w-full py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
          >
            Atualizar
          </button>
        </div>

        {/* Report Summary */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-500 mx-auto"></div>
          </div>
        ) : report ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div id="report-content" className="space-y-6 bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-4 border-l-4 border-danger-500 bg-danger-50 dark:bg-danger-900/20">
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">Gasto Total</p>
                  <p className="text-2xl font-bold text-danger-600 dark:text-danger-500 mt-1">
                    R$ {report.gasto_total.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-lg p-4 border-l-4 border-success-500 bg-success-50 dark:bg-success-900/20">
                  <p className="text-neutral-600 dark:text-neutral-400 text-xs font-medium">Saldo Atual</p>
                  <p
                    className={`text-2xl font-bold mt-1 ${
                      report.saldo_atual >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'
                    }`}
                  >
                    R$ {report.saldo_atual.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Transactions List */}
              <div>
                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                  Transações ({report.transacoes.length})
                </h3>

                {report.transacoes.length === 0 ? (
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm text-center py-4">
                    Nenhuma transação no período
                  </p>
                ) : (
                  <div className="space-y-3">
                    {report.transacoes.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded border border-neutral-200 dark:border-neutral-700"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100">{t.descricao}</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {new Date(t.data).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <p className="font-bold text-danger-600 dark:text-danger-500">R$ {t.valor.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="!bg-success-600 hover:!bg-success-700 dark:!bg-success-500 dark:hover:!bg-success-600 flex-1 py-2 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📚 CSV
              </button>
              <button
                onClick={handleExportPDF}
                className="!bg-danger-600 hover:!bg-danger-700 dark:!bg-danger-500 dark:hover:!bg-danger-600 flex-1 py-2 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                📄 PDF
              </button>
            </div>
          </div>
        ) : null}

        {/* Back Link */}
        <Link
          href="/dashboard"
          className="block w-full py-2 bg-neutral-600 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold rounded-lg text-center transition-colors"
        >
          Voltar ao Dashboard
        </Link>
      </main>
    </div>
  );
}
