'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';

interface CreatedUser extends User {
  temp_password?: string;
}

export default function UsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ nome: '', email: '', tipo_usuario: 'user' as const });
  const [submitting, setSubmitting] = useState(false);
  const [newUser, setNewUser] = useState<CreatedUser | null>(null);

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

    try {
      const res = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao criar usuário');
        return;
      }

      const data = await res.json();
      setNewUser(data.data);
      setFormData({ nome: '', email: '', tipo_usuario: 'user' });
      setShowForm(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: !currentStatus }),
      });

      if (res.ok) {
        await fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Header */}
      <header className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">👥 Usuários</h1>
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

        {/* New User Password Modal */}
        {newUser && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700/50 rounded-lg">
            <p className="font-bold text-success-700 dark:text-success-600 mb-3">✅ Usuário criado com sucesso!</p>
            <div className="space-y-3 bg-white dark:bg-neutral-800 p-3 rounded">
              <div>
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Nome:</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{newUser.nome}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Email:</p>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{newUser.email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Senha Temporária:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUser.temp_password || ''}
                    readOnly
                    className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm font-mono text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    onClick={() => {
                      if (newUser.temp_password) {
                        navigator.clipboard.writeText(newUser.temp_password);
                      }
                    }}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 p-2 rounded">
                ⚠️ Compartilhe esta senha com o usuário. Ele pode alterá-la após fazer login.
              </p>
            </div>
            <button
              onClick={() => setNewUser(null)}
              className="mt-3 w-full py-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors"
        >
          {showForm ? '✕ Cancelar' : '+ Novo Usuário'}
        </button>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                required
                minLength={3}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Tipo</label>
              <select
                value={formData.tipo_usuario}
                onChange={(e) =>
                  setFormData({ ...formData, tipo_usuario: e.target.value as any })
                }
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="user">Usuário Regular</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-neutral-400 dark:disabled:bg-neutral-700 text-white font-semibold rounded-lg transition-colors"
            >
              {submitting ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        )}

        {/* Users List */}
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
              <div
                key={u.id}
                className="bg-white dark:bg-neutral-800 rounded-lg shadow dark:shadow-dark-md p-4 flex items-center justify-between hover:shadow-md dark:hover:shadow-dark-lg transition-shadow"
              >
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900 dark:text-neutral-100">{u.nome}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">{u.email}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Tipo: <span className="font-semibold">{u.tipo_usuario}</span>
                  </p>
                </div>
                <button
                  onClick={() => handleToggleActive(u.id, u.ativo)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
                    u.ativo
                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-800/50'
                      : 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 hover:bg-danger-200 dark:hover:bg-danger-800/50'
                  }`}
                >
                  {u.ativo ? '✓ Ativo' : '✗ Inativo'}
                </button>
              </div>
            ))}
          </div>
        )}

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
          className="block w-full py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-center transition-colors"
        >
          ← Voltar
        </Link>
      </main>
    </div>
  );
}
