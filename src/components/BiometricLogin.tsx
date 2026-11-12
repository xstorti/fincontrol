'use client';

import { useState, useEffect } from 'react';
import { useBiometry } from '@/hooks/useBiometry';
import { Fingerprint, AlertCircle } from 'lucide-react';

interface BiometricLoginProps {
  email: string;
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
}

/**
 * Componente para fazer login com biometria
 */
export function BiometricLogin({ email, onSuccess, onError }: BiometricLoginProps) {
  const { isBiometryAvailable, isLoading, error, loginWithBiometry } = useBiometry();
  const [showBiometric, setShowBiometric] = useState(false);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleBiometricLogin = async () => {
    if (!email) {
      onError('Por favor, insira seu email primeiro');
      return;
    }

    const user = await loginWithBiometry(email);
    if (user) {
      onSuccess(user);
    }
  };

  useEffect(() => {
    setShowBiometric(isBiometryAvailable && !!email);
  }, [isBiometryAvailable, email]);

  if (!showBiometric) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-neutral-600/50"></div>
        <span className="text-xs text-neutral-500 font-medium">OU</span>
        <div className="flex-1 h-px bg-neutral-600/50"></div>
      </div>

      {/* Biometric Button */}
      <button
        type="button"
        onClick={handleBiometricLogin}
        disabled={isLoading}
        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-neutral-600 disabled:to-neutral-600 text-white font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 disabled:shadow-none"
      >
        <Fingerprint size={20} strokeWidth={2.5} />
        <span>{isLoading ? 'Verificando...' : 'Entrar com Biometria'}</span>
      </button>

      {/* Info Message */}
      <p className="text-xs text-neutral-400 text-center">
        Use sua impressão digital ou reconhecimento facial para fazer login de forma rápida e segura
      </p>

      {/* Not Available Message */}
      {!isBiometryAvailable && (
        <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex gap-2 items-start">
          <AlertCircle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <p className="text-xs text-yellow-300">
            Biometria não disponível. Use email e senha para fazer login.
          </p>
        </div>
      )}
    </div>
  );
}
