'use client';

import { useState } from 'react';
import { useBiometry } from '@/hooks/useBiometry';
import { Fingerprint, CheckCircle, AlertCircle } from 'lucide-react';

interface BiometricRegisterProps {
  email: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Componente para registrar biometria
 */
export function BiometricRegister({ email, onSuccess, onError }: BiometricRegisterProps) {
  const { isBiometryAvailable, isLoading, error, registerBiometry } = useBiometry();
  const [showForm, setShowForm] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [registered, setRegistered] = useState(false);

  const handleRegister = async () => {
    if (!deviceName.trim()) {
      onError?.('Por favor, insira um nome para o dispositivo');
      return;
    }

    const success = await registerBiometry(email, deviceName);
    if (success) {
      setRegistered(true);
      setShowForm(false);
      setDeviceName('');
      onSuccess?.();
    } else {
      onError?.(error || 'Erro ao registrar biometria');
    }
  };

  if (!isBiometryAvailable) {
    return (
      <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex gap-3 items-start">
        <AlertCircle size={20} className="text-yellow-400 flex-shrink-0" strokeWidth={2.5} />
        <div>
          <h4 className="font-semibold text-yellow-300 mb-1">Biometria não disponível</h4>
          <p className="text-sm text-yellow-200">
            Este dispositivo não suporta autenticação biométrica. Você poderá fazer login apenas com email e senha.
          </p>
        </div>
      </div>
    );
  }

  if (registered) {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex gap-3 items-start">
        <CheckCircle size={20} className="text-green-400 flex-shrink-0" strokeWidth={2.5} />
        <div>
          <h4 className="font-semibold text-green-300 mb-1">Biometria registrada!</h4>
          <p className="text-sm text-green-200">
            Você agora pode fazer login usando sua impressão digital ou reconhecimento facial.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white flex items-center gap-2 mb-1">
            <Fingerprint size={20} className="text-emerald-400" strokeWidth={2.5} />
            Login com Biometria
          </h3>
          <p className="text-sm text-neutral-400">
            Registre sua biometria para fazer login mais rápido
          </p>
        </div>
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Fingerprint size={18} strokeWidth={2.5} />
          Registrar Biometria
        </button>
      ) : (
        <div className="space-y-3 p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-lg">
          <div>
            <label className="block text-sm font-semibold text-neutral-200 mb-2">
              Nome do Dispositivo
            </label>
            <input
              type="text"
              placeholder="Ex: Meu iPhone, Samsung Galaxy"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full px-4 py-2.5 bg-neutral-700/50 border border-neutral-600/50 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRegister}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              {isLoading ? 'Registrando...' : 'Registrar'}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setDeviceName('');
              }}
              disabled={isLoading}
              className="flex-1 py-2.5 bg-neutral-700 hover:bg-neutral-600 text-white font-semibold rounded-lg transition-all duration-300"
            >
              Cancelar
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 items-start">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
