'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function AlterarSenhaPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate
    if (!formData.senha_atual || !formData.nova_senha || !formData.confirmar_senha) {
      setError('Preencha todos os campos');
      return;
    }

    if (formData.nova_senha !== formData.confirmar_senha) {
      setError('As senhas não conferem');
      return;
    }

    if (formData.nova_senha.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Send cookies automatically
        body: JSON.stringify({
          senha_atual: formData.senha_atual,
          nova_senha: formData.nova_senha,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Erro ao alterar senha');
        return;
      }

      setSuccess(true);
      setFormData({ senha_atual: '', nova_senha: '', confirmar_senha: '' });

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary-900">
      {/* Header */}
      <header className="bg-neutral-800/50 backdrop-blur-sm border-b border-neutral-700 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-black text-white">🔐 Alterar Senha</h1>
          <Link href="/admin" className="text-neutral-400 hover:text-white transition-colors">
            ✕
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-success-900/30 border border-success-500/50 rounded-lg">
              <p className="text-success-400 font-semibold">✅ Senha alterada com sucesso!</p>
              <p className="text-success-300 text-sm mt-1">Redirecionando em 2 segundos...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-900/30 border border-danger-500/50 rounded-lg">
              <p className="text-danger-400 font-semibold">❌ {error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-neutral-800/80 backdrop-blur-md rounded-2xl p-8 space-y-6 border border-neutral-700 shadow-2xl">
            {/* Senha Atual */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Senha Atual</label>
              <div className="relative">
                <input
                  type={showPasswords.atual ? 'text' : 'password'}
                  value={formData.senha_atual}
                  onChange={(e) => setFormData({ ...formData, senha_atual: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
                  placeholder="Digite sua senha atual"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, atual: !showPasswords.atual })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  {showPasswords.atual ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Nova Senha</label>
              <div className="relative">
                <input
                  type={showPasswords.nova ? 'text' : 'password'}
                  value={formData.nova_senha}
                  onChange={(e) => setFormData({ ...formData, nova_senha: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, nova: !showPasswords.nova })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  {showPasswords.nova ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-semibold text-neutral-300 mb-2">Confirmar Nova Senha</label>
              <div className="relative">
                <input
                  type={showPasswords.confirmar ? 'text' : 'password'}
                  value={formData.confirmar_senha}
                  onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-neutral-700 border border-neutral-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 transition-all"
                  placeholder="Confirme a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirmar: !showPasswords.confirmar })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
                >
                  {showPasswords.confirmar ? <EyeOff size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:from-neutral-600 disabled:to-neutral-700 text-white font-black rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 shadow-lg"
            >
              {loading ? 'Alterando...' : 'Alterar Senha'}
            </button>

            {/* Back Link */}
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 w-full py-2 text-neutral-400 hover:text-neutral-300 font-medium transition-colors"
            >
              <ArrowLeft size={18} strokeWidth={2.5} />
              Voltar ao Painel
            </Link>
          </form>

          {/* Info */}
          <div className="mt-8 p-4 bg-primary-900/20 border border-primary-700/50 rounded-lg">
            <p className="text-primary-300 text-sm leading-relaxed">
              💡 <strong>Dica:</strong> Use uma senha forte com pelo menos 6 caracteres, incluindo letras, números e símbolos.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
