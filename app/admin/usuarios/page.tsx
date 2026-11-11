'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/types';
import { Trash2 } from 'lucide-react';

interface CreatedUser extends User {
  temp_password?: string;
}

interface PasswordChangeState {
  userId: string;
  userName: string;
  gerar_temporaria: boolean;
  nova_senha: string;
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
  const [editingPassword, setEditingPassword] = useState<PasswordChangeState | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordResult, setPasswordResult] = useState<{ user_id: string; temp_password?: string } | null>(null);
  const [clearingUser, setClearingUser] = useState<{ id: string; name: string } | null>(null);
  const [clearLoading, setClearLoading] = useState(false);
  const [clearConfirmed, setClearConfirmed] = useState(false);

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

  const handleDelete = async (userId: string, userName: string) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        await fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao deletar usuário');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPassword) return;

    setPasswordSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/usuarios/${editingPassword.userId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send cookies automatically
        body: JSON.stringify({
          gerar_temporaria: editingPassword.gerar_temporaria,
          nova_senha: editingPassword.gerar_temporaria ? undefined : editingPassword.nova_senha,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao alterar senha');
        return;
      }

      const data = await res.json();
      setPasswordResult({ user_id: editingPassword.userId, temp_password: data.data.temp_password });
      setEditingPassword(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleClearTransactions = async () => {
    if (!clearingUser) return;

    setClearLoading(true);

    try {
      const res = await fetch('/api/admin/transacoes/limpar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          usuario_id: clearingUser.id,
          confirmar: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao limpar transações');
        setClearLoading(false);
        return;
      }

      const data = await res.json();
      setClearingUser(null);
      setError('');
      alert(`✅ ${data.data.deletadas} transações deletadas com sucesso!`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setClearLoading(false);
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

        {/* Change Password Modal */}
        {editingPassword && (
          <form onSubmit={handleChangePassword} className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700/50 rounded-lg space-y-4">
            <p className="font-bold text-primary-700 dark:text-primary-600">🔐 Alterar Senha - {editingPassword.userName}</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gerar_temporaria"
                  checked={editingPassword.gerar_temporaria}
                  onChange={(e) =>
                    setEditingPassword({
                      ...editingPassword,
                      gerar_temporaria: e.target.checked,
                      nova_senha: '',
                    })
                  }
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <label htmlFor="gerar_temporaria" className="text-sm font-medium text-neutral-900 dark:text-neutral-100 cursor-pointer">
                  Gerar senha temporária aleatória
                </label>
              </div>

              {!editingPassword.gerar_temporaria && (
                <div>
                  <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    value={editingPassword.nova_senha}
                    onChange={(e) => setEditingPassword({ ...editingPassword, nova_senha: e.target.value })}
                    minLength={6}
                    required={!editingPassword.gerar_temporaria}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {passwordSubmitting ? 'Alterando...' : 'Alterar Senha'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPassword(null)}
                  className="flex-1 py-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Password Changed Success */}
        {passwordResult && (
          <div className="p-4 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700/50 rounded-lg">
            <p className="font-bold text-success-700 dark:text-success-600 mb-3">✅ Senha alterada com sucesso!</p>
            {passwordResult.temp_password && (
              <div className="space-y-3 bg-white dark:bg-neutral-800 p-3 rounded mb-3">
                <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">Senha Temporária Gerada:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={passwordResult.temp_password}
                    readOnly
                    className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded text-sm font-mono text-neutral-900 dark:text-neutral-100"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(passwordResult.temp_password || '');
                    }}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-xs font-semibold rounded transition-colors"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setPasswordResult(null)}
              className="w-full py-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        )}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full py-3 bg-neutral-700 hover:bg-neutral-800 text-white font-black rounded-lg transition-colors shadow-md hover:shadow-lg"
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
              className="w-full py-3 bg-neutral-700 hover:bg-neutral-800 disabled:bg-neutral-500 text-white font-black rounded-lg transition-colors shadow-md hover:shadow-lg disabled:cursor-not-allowed"
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
                <div className="flex gap-2 flex-wrap justify-end">
                  <button
                    onClick={() => setEditingPassword({ userId: u.id, userName: u.nome, gerar_temporaria: true, nova_senha: '' })}
                    className="px-3 py-1 text-xs font-semibold rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-800/50 transition-colors"
                  >
                    🔐 Senha
                  </button>
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
                  <button
                    onClick={() => handleDelete(u.id, u.nome)}
                    className="px-3 py-1 text-xs font-semibold rounded bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400 hover:bg-danger-200 dark:hover:bg-danger-800/50 transition-colors"
                  >
                    🗑️ Deletar
                  </button>
                  <button
                    onClick={() => {
                      setClearingUser({ id: u.id, name: u.nome });
                      setClearConfirmed(false);
                    }}
                    className="px-3 py-1 text-xs font-semibold rounded bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 hover:bg-warning-200 dark:hover:bg-warning-800/50 transition-colors"
                  >
                    🧹 Limpar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear Transactions Modal */}
        {clearingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg max-w-md w-full p-6 space-y-4">
              <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">⚠️ Limpar Despesas</h2>
              
              <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700/50 rounded-lg p-4">
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                  <strong>Atenção:</strong> Isto vai deletar <strong>TODAS</strong> as despesas de <strong>{clearingUser.name}</strong>.
                </p>
                <p className="text-xs text-danger-600 dark:text-danger-400 font-semibold">
                  ⚠️ Esta ação <strong>NÃO PODE SER DESFEITA</strong>!
                </p>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearConfirmed}
                    onChange={(e) => setClearConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    Confirmo que desejo deletar todas as despesas
                  </span>
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleClearTransactions}
                  disabled={!clearConfirmed || clearLoading}
                  className="flex-1 py-2 bg-danger-600 hover:bg-danger-700 disabled:bg-neutral-400 dark:disabled:bg-neutral-600 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {clearLoading ? 'Limpando...' : 'Deletar Tudo'}
                </button>
                <button
                  onClick={() => {
                    setClearingUser(null);
                    setClearConfirmed(false);
                  }}
                  className="flex-1 py-2 bg-neutral-300 dark:bg-neutral-700 hover:bg-neutral-400 dark:hover:bg-neutral-600 text-neutral-900 dark:text-neutral-100 font-semibold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
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
