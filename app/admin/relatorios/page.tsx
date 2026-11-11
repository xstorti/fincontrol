'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
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

  const handleExportPDF = async () => {
    if (!reportData) return;

    try {
      const element = document.getElementById('report-content');
      if (!element) return;

      // Capturar o conteúdo em canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      // Criar PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 10;

      // Adicionar título
      pdf.setFontSize(16);
      pdf.setFont('Helvetica', 'bold');
      pdf.text('Relatório FinControl', pdfWidth / 2, position, { align: 'center' });

      position += 10;
      pdf.setFontSize(10);
      pdf.setFont('Helvetica', 'normal');
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, pdfWidth / 2, position, { align: 'center' });

      position += 15;

      // Adicionar conteúdo capturado
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);

      // Se a imagem for muito alta, adicionar em múltiplas páginas
      let totalHeight = position + imgHeight;
      while (totalHeight > pdfHeight) {
        pdf.addPage();
        position = 10;
        totalHeight -= pdfHeight - 20;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      }

      // Salvar PDF
      pdf.save(
        `relatorio_${reportData.usuario.nome.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`
      );
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar PDF. Tente novamente.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">📊 Relatórios</h1>
          <Link href="/admin" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
            ✕
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700/50 rounded-lg">
            <p className="text-danger-700 dark:text-danger-600 text-sm">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6 space-y-4">
          <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Filtros</h3>

          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 dark:border-primary-500 mx-auto"></div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Usuário</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                className="w-full py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
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
            <div id="report-content" className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6 space-y-4">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Resumo</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">Usuário</p>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100">{reportData.usuario.nome}</p>
                </div>
                <div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">Email</p>
                  <p className="font-bold text-neutral-900 dark:text-neutral-100 text-sm break-all">
                    {reportData.usuario.email}
                  </p>
                </div>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">Gasto Total</p>
                    <p className="text-2xl font-bold text-danger-600 dark:text-danger-500">
                      R$ {reportData.gasto_total.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 dark:text-neutral-400 text-sm">Saldo Atual</p>
                    <p
                      className={`text-2xl font-bold ${
                        reportData.saldo_atual >= 0 ? 'text-success-600 dark:text-success-500' : 'text-danger-600 dark:text-danger-500'
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
                  className="flex-1 py-2 bg-success-600 hover:bg-success-700 dark:bg-success-500 dark:hover:bg-success-600 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  📥 CSV
                </button>
                <button
                  onClick={handleExportPDF}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors text-sm"
                >
                  📄 PDF
                </button>
              </div>
            </div>

            {/* Transactions */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6">
              <h3 className="font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                Transações ({reportData.transacoes.length})
              </h3>

              {reportData.transacoes.length === 0 ? (
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">Nenhuma transação no período</p>
              ) : (
                <div className="space-y-3">
                  {reportData.transacoes.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded border border-neutral-200 dark:border-neutral-700"
                    >
                      <div>
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
        )}

        {/* Back Link */}
        <Link
          href="/admin"
          className="block w-full py-2 bg-neutral-600 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold rounded-lg text-center transition-colors"
        >
          &larr; Voltar
        </Link>
      </main>
    </div>
  );
}
