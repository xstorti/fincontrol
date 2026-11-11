'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LoadingButton, ErrorAlert, SuccessAlert } from '@/components';

export default function AdicionarGastoPage() {
  const router = useRouter();
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maxDate, setMaxDate] = useState('');

  useEffect(() => {
    // Initialize data and maxDate with today's date (client-side only)
    const today = new Date().toISOString().split('T')[0];
    setData(today);
    setMaxDate(today);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data,
          descricao,
          valor: parseFloat(valor),
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Erro ao adicionar gasto');
        return;
      }

      setSuccess('Gasto adicionado com sucesso! Redirecionando...');

      // Reset form
      setDescricao('');
      setValor('');
      setData(new Date().toISOString().split('T')[0]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao adicionar gasto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">💰 FinControl</h1>
          <Link href="/dashboard" className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200">
            ✕
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md mx-auto w-full px-4 py-8">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">Adicionar Gasto</h2>

        {/* Success Alert */}
        {success && <SuccessAlert message="Gasto adicionado!" details="Redirecionando para o dashboard..." />}

        {/* Error Alert */}
        {error && <ErrorAlert message="Erro ao adicionar gasto" details={error} />}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6">
          {/* Data */}
          <div>
            <label htmlFor="data" className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Data *
            </label>
            <input
              id="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              max={maxDate}
              required
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:focus:ring-primary-400"
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="descricao" className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Descrição *
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Lanche na escola, Cinema, Roupa..."
              required
              minLength={3}
              maxLength={100}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:focus:ring-primary-400 resize-none"
            />
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
              {descricao.length}/100 caracteres
            </p>
          </div>

          {/* Valor */}
          <div>
            <label htmlFor="valor" className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">
              Valor (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-neutral-600 dark:text-neutral-400 font-semibold">R$</span>
              <input
                id="valor"
                type="number"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                className="w-full pl-12 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:focus:ring-primary-400"
              />
            </div>
          </div>

          {/* Submit Button */}
          <LoadingButton
            type="submit"
            loading={loading}
            disabled={loading || !data || !descricao || !valor}
            className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors mt-6"
          >
            Enviar Gasto
          </LoadingButton>

          {/* Cancel Link */}
          <Link
            href="/dashboard"
            className="block w-full py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold rounded-lg text-center transition-colors"
          >
            Cancelar
          </Link>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            💡 <strong>Dica:</strong> Um email será enviado para os administradores com os detalhes deste gasto.
          </p>
        </div>
      </main>
    </div>
  );
}
