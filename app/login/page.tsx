'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton, ErrorAlert } from '@/components';
import { Lock, Mail, ArrowRight } from 'lucide-react';

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

      // Check if password is temporary
      if (data.data?.senha_temporaria) {
        router.push('/mudar-senha');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 px-4 relative overflow-hidden">
      {/* Animated background gradient elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary-500/10 rounded-full blur-3xl"></div>

      {/* Main Container */}
      <div className="w-full max-w-sm relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          {/* Icon with glow effect */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl mb-6 shadow-2xl shadow-primary-500/50">
            <span className="text-4xl">💰</span>
          </div>
          
          {/* Branding */}
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">FinControl</h1>
          <p className="text-base text-neutral-400 font-medium">Controle Financeiro Familiar</p>
        </div>

        {/* Login Card with glassmorphism effect */}
        <div className="relative group">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Card */}
          <div className="relative bg-neutral-800/80 backdrop-blur-xl border border-neutral-700/50 rounded-3xl shadow-2xl p-8 space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-danger-500/10 border border-danger-500/30 rounded-xl">
                <p className="text-sm text-danger-400 font-medium">{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-200 mb-3">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-4 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-primary-400" strokeWidth={2.5} />
                  <input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500/50 focus:border-primary-500/50 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="senha" className="block text-sm font-semibold text-neutral-200 mb-3">
                  Senha
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-4 w-5 h-5 text-neutral-500 transition-colors group-focus-within:text-primary-400" strokeWidth={2.5} />
                  <input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-700/50 border border-neutral-600/50 hover:border-neutral-500/50 focus:border-primary-500/50 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <LoadingButton
                type="submit"
                loading={loading}
                disabled={loading}
                className="w-full py-3.5 mt-8 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-500 hover:to-secondary-500 disabled:from-neutral-600 disabled:to-neutral-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Conectando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={18} strokeWidth={2.5} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </LoadingButton>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-500 mt-8 font-medium">
          © 2024 FinControl • Controle Financeiro Familiar
        </p>
      </div>
    </div>
  );
}
