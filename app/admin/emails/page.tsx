'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmailConfig } from '@/types';

export default function EmailsPage() {
  const router = useRouter();
  const [emailList, setEmailList] = useState<EmailConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    notifica_despesa: true,
    notifica_credito: true,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/admin/config/emails');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        return;
      }

      const data = await res.json();
      setEmailList(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/config/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao adicionar email');
        return;
      }

      setSuccess('✅ Email adicionado com sucesso!');
      setFormData({
        email: '',
        notifica_despesa: true,
        notifica_credito: true,
      });
      setShowForm(false);
      await fetchEmails();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (email: string, field: string, value: boolean) => {
    try {
      const res = await fetch('/api/admin/config/emails', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          [field]: !value,
        }),
      });

      if (res.ok) {
        await fetchEmails();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (email: string) => {
    if (!confirm(`Tem certeza que deseja remover ${email}?`)) return;

    try {
      const res = await fetch('/api/admin/config/emails', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        await fetchEmails();
        setSuccess('✅ Email removido com sucesso!');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-purple-700">📧 Notificações</h1>
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

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors"
        >
          {showForm ? '✕ Cancelar' : '+ Adicionar Email'}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="exemplo@email.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifica_despesa}
                  onChange={(e) =>
                    setFormData({ ...formData, notifica_despesa: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">Notificar de despesas</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.notifica_credito}
                  onChange={(e) =>
                    setFormData({ ...formData, notifica_credito: e.target.checked })
                  }
                  className="w-4 h-4 text-orange-600 rounded"
                />
                <span className="ml-3 text-sm text-gray-700">Notificar de créditos</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.email}
              className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Adicionando...' : 'Adicionar Email'}
            </button>
          </form>
        )}

        {/* Emails List */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">Destinatários de Notificação</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto"></div>
            </div>
          ) : emailList.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-600">Nenhum email configurado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailList.map((e) => (
                <div
                  key={e.email}
                  className="bg-white rounded-lg shadow p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 break-all">{e.email}</p>
                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={e.notifica_despesa}
                          onChange={() =>
                            handleToggle(e.email, 'notifica_despesa', e.notifica_despesa)
                          }
                          className="w-3 h-3 text-orange-600 rounded"
                        />
                        <span className="ml-2">Despesas</span>
                      </label>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={e.notifica_credito}
                          onChange={() =>
                            handleToggle(e.email, 'notifica_credito', e.notifica_credito)
                          }
                          className="w-3 h-3 text-orange-600 rounded"
                        />
                        <span className="ml-2">Créditos</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(e.email)}
                    className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 rounded transition-colors whitespace-nowrap"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-sm">
            💡 <strong>Dica:</strong> Estes emails receberão notificações quando usuários adicionarem gastos ou receberem créditos.
          </p>
        </div>

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
