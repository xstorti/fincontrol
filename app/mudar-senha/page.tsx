'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton, ErrorAlert, SuccessAlert } from '@/components';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function MudarSenhaPage() {
  const router = useRouter();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [senhaNova, setSenhaNova] = useState('');
  const [senhaNovaConfirm, setSenhaNovaConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTemporaryPassword, setIsTemporaryPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    // Get user info from auth/me endpoint
    const fetchUserInfo = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (res.ok && data.data) {
          setUserEmail(data.data.email);
          setIsTemporaryPassword(data.data.senha_temporaria);
        }
      } catch (err) {
        console.error('Erro ao buscar info do usuário:', err);
      }
    };

    fetchUserInfo();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate
    if (!senhaAtual) {
      setError('Senha atual é obrigatória');
      return;
    }

    if (!senhaNova) {
      setError('Nova senha é obrigatória');
      return;
    }

    if (senhaNova.length < 6) {
      setError('Nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (senhaNova !== senhaNovaConfirm) {
      setError('As senhas não conferem');
      return;
    }

    if (senhaAtual === senhaNova) {
      setError('A nova senha deve ser diferente da atual');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/mudar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senhaAtual,
          senhaNova,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao alterar senha');
        return;
      }

      setSuccess(true);
      setSenhaAtual('');
      setSenhaNova('');
      setSenhaNovaConfirm('');

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4 py-8 relative overflow-hidden">
      {/* Animated background gradient elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl mb-6 shadow-2xl shadow-primary-500/50">
            <Lock className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>

          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">Alterar Senha</h1>
          <p className="text-base text-neutral-400 font-medium">
            {isTemporaryPassword ? '🔐 Você está usando uma senha temporária' : 'Atualize sua senha de segurança'}
          </p>
        </div>

        {/* Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/50 rounded-3xl shadow-2xl p-8 space-y-6">
            {/* Alerts */}
            {error && <ErrorAlert message={error} />}
            {success && (
              <SuccessAlert message="✅ Senha alterada com sucesso! Redirecionando..." />
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-semibold text-neutral-200 mb-3">
                  Senha Atual
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-primary-300" strokeWidth={2.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite sua senha atual"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3.5 bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500/50 focus:border-primary-500/50 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-300 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" strokeWidth={2.5} />
                    ) : (
                      <Eye className="w-5 h-5" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-neutral-200 mb-3">
                  Nova Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-primary-300" strokeWidth={2.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Digite a nova senha"
                    value={senhaNova}
                    onChange={(e) => setSenhaNova(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500/50 focus:border-primary-500/50 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-2">Mínimo 6 caracteres</p>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-semibold text-neutral-200 mb-3">
                  Confirme a Nova Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-primary-300" strokeWidth={2.5} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirme a nova senha"
                    value={senhaNovaConfirm}
                    onChange={(e) => setSenhaNovaConfirm(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-12 pr-12 py-3.5 bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500/50 focus:border-primary-500/50 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                loading={loading}
                loadingText="Alterando..."
                className="w-full"
              >
                Alterar Senha
              </LoadingButton>
            </form>

            {/* Info Box */}
            <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-xl">
              <p className="text-xs text-primary-400">
                💡 Por segurança, escolha uma senha forte e única que você consiga memorizar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
