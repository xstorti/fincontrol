'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Credit } from '@/types';

interface UserWithBalance extends User {
  saldo: number;
  creditos?: Credit[];
}

export default function CreditosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [editingCredit, setEditingCredit] = useState<string | null>(null);
  const [editData, setEditData] = useState({ valor: '', descricao: '' });
  const [formData, setFormData] = useState({
    usuario_id: '',
    valor: '',
    descricao: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/usuarios-com-saldo');
      if (!res.ok) {
        if (res.status === 401) router.push('/login');
        return;
      }

      const data = await res.json();
      setUsers(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCredits = async (userId: string | number) => {
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}/creditos`);
      if (res.ok) {
        const data = await res.json();
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, creditos: data.data } : u
          )
        );
      }
    } catch (err) {
      console.error('Erro ao buscar créditos:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/creditos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: formData.usuario_id,
          valor: parseFloat(formData.valor),
          descricao: formData.descricao,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao adicionar crédito');
        return;
      }

      setSuccess('✅ Crédito adicionado com sucesso!');
      setFormData({ usuario_id: '', valor: '', descricao: '' });
      setShowForm(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCredit = async (creditId: string) => {
    try {
      const res = await fetch(`/api/admin/creditos/${creditId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: editData.valor ? parseFloat(editData.valor) : undefined,
          descricao: editData.descricao || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao atualizar crédito');
        return;
      }

      setSuccess('✅ Crédito atualizado com sucesso!');
      setEditingCredit(null);
      setEditData({ valor: '', descricao: '' });
      await fetchUsers();
      if (expandedUser) {
        await fetchUserCredits(expandedUser);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteCredit = async (creditId: string) => {
    if (!confirm('Tem certeza que deseja deletar este crédito?')) return;

    try {
      const res = await fetch(`/api/admin/creditos/${creditId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao deletar crédito');
        return;
      }

      setSuccess('✅ Crédito deletado com sucesso!');
      await fetchUsers();
      if (expandedUser) {
        await fetchUserCredits(expandedUser);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleUserExpand = async (userId: string | number) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
    } else {
      setExpandedUser(String(userId));
      await fetchUserCredits(userId);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">💰 Créditos</h1>
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

        {success && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700/50 rounded-lg">
            <p className="text-success-700 dark:text-success-600 text-sm">{success}</p>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
        >
          {showForm ? '✕ Cancelar' : '+ Adicionar Crédito'}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Usuário</label>
              <select
                value={formData.usuario_id}
                onChange={(e) => setFormData({ ...formData, usuario_id: e.target.value })}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Selecione um usuário...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nome} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Valor (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-neutral-600 dark:text-neutral-400 font-semibold">R$</span>
                <input
                  type="number"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="w-full pl-12 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Descrição</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Mesada de outubro"
                required
                minLength={3}
                maxLength={100}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !formData.usuario_id || !formData.valor}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Adicionando...' : 'Adicionar Crédito'}
            </button>
          </form>
        )}

        {/* Users List */}
        <div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Saldo Atual dos Usuários</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-500 mx-auto"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-8 text-center">
              <p className="text-neutral-600 dark:text-neutral-400">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="space-y-2">
                  <button
                    onClick={() => toggleUserExpand(u.id)}
                    className="w-full bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-4 flex items-center justify-between hover:shadow-md dark:hover:shadow-dark-lg transition-shadow text-left"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{u.nome}</p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          u.saldo >= 0
                            ? 'text-success-600 dark:text-success-400'
                            : 'text-danger-600 dark:text-danger-400'
                        }`}
                      >
                        R$ {u.saldo.toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-600 dark:text-neutral-400">
                        {expandedUser === String(u.id) ? '▼' : '▶'}
                      </p>
                    </div>
                  </button>

                  {/* Credits List */}
                  {expandedUser === String(u.id) && u.creditos && (
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-4 space-y-2 ml-2 border-l-4 border-primary-500">
                      {u.creditos.length === 0 ? (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 py-2">Nenhum crédito adicionado</p>
                      ) : (
                        u.creditos.map((credit) => (
                          <div key={credit.id} className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded">
                            {editingCredit === String(credit.id) ? (
                              <div className="space-y-2">
                                <div>
                                  <label className="block text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                                    Valor (R$)
                                  </label>
                                  <input
                                    type="number"
                                    value={editData.valor}
                                    onChange={(e) => setEditData({ ...editData, valor: e.target.value })}
                                    placeholder={String(credit.valor)}
                                    step="0.01"
                                    className="w-full px-3 py-1 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-neutral-900 dark:text-neutral-100 mb-1">
                                    Descrição
                                  </label>
                                  <input
                                    type="text"
                                    value={editData.descricao}
                                    onChange={(e) => setEditData({ ...editData, descricao: e.target.value })}
                                    placeholder={credit.descricao}
                                    className="w-full px-3 py-1 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 rounded text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditCredit(String(credit.id))}
                                    className="flex-1 py-1 bg-success-600 hover:bg-success-700 text-white text-xs font-semibold rounded transition-colors"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCredit(null);
                                      setEditData({ valor: '', descricao: '' });
                                    }}
                                    className="flex-1 py-1 bg-neutral-400 dark:bg-neutral-600 hover:bg-neutral-500 dark:hover:bg-neutral-700 text-white text-xs font-semibold rounded transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex justify-between items-start mb-1">
                                  <div>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{credit.descricao}</p>
                                    <p className="text-xs text-neutral-600 dark:text-neutral-400">
                                      {new Date(credit.data_creditada).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <p className="text-sm font-bold text-success-600 dark:text-success-400">R$ {credit.valor.toFixed(2)}</p>
                                </div>
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => {
                                      setEditingCredit(String(credit.id));
                                      setEditData({ valor: String(credit.valor), descricao: credit.descricao });
                                    }}
                                    className="flex-1 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs font-semibold rounded transition-colors"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCredit(String(credit.id))}
                                    className="flex-1 py-1 bg-danger-600 hover:bg-danger-700 text-white text-xs font-semibold rounded transition-colors"
                                  >
                                    Deletar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <Link
          href="/admin"
          className="block w-full py-2 bg-neutral-600 dark:bg-neutral-700 hover:bg-neutral-700 dark:hover:bg-neutral-600 text-white font-semibold rounded-lg text-center transition-colors"
        >
          ← Voltar
        </Link>
      </main>
    </div>
  );
}
