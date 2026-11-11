'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton, ErrorAlert, ThemeToggle } from '@/components';
import { Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-neutral-50 via-primary-50 to-neutral-50 dark:from-neutral-900 dark:via-primary-900/20 dark:to-neutral-900 px-4 py-8 relative">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-sm">
        {/* Header/Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/30 rounded-2xl mb-4">
            <span className="text-3xl">💰</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">FinControl</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Controle Financeiro Familiar</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl dark:shadow-dark-xl p-8">
          {/* Error Alert */}
          {error && <ErrorAlert message="Falha na autenticação" details={error} />}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                <input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 rounded-lg text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <LoadingButton
              type="submit"
              loading={loading}
              disabled={loading}
              className="w-full py-3 mt-6 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white font-semibold rounded-lg transition-colors"
            >
              {loading ? 'Conectando...' : 'Entrar'}
            </LoadingButton>
          </form>

          {/* Test Credentials */}
          <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <p className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-3">👤 Credenciais de Teste:</p>
            <div className="space-y-2 text-xs">
              <div className="bg-neutral-100 dark:bg-neutral-900 px-3 py-2 rounded">
                <p className="text-neutral-600 dark:text-neutral-400">
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Admin:</span> pai@familia.com / admin123
                </p>
              </div>
              <div className="bg-neutral-100 dark:bg-neutral-900 px-3 py-2 rounded">
                <p className="text-neutral-600 dark:text-neutral-400">
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Usuário:</span> filha@familia.com / user123
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-600 dark:text-neutral-500 mt-6">
          © 2024 FinControl. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
