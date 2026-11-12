'use client';

import { useState, useEffect } from 'react';
import { useBiometry } from '@/hooks/useBiometry';
import { Fingerprint, AlertCircle, X } from 'lucide-react';

interface BiometricLoginProps {
  email: string;
  onSuccess: (user: any) => void;
  onError: (error: string) => void;
}

/**
 * Detectar se é dispositivo móvel (iOS/Android)
 */
function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent.toLowerCase();
  // Verificar especificamente por iOS e Android (Android é baseado em Linux)
  return /iphone|ipad|android/.test(ua);
}

/**
 * Componente para fazer login com biometria
 * Abre modal de registro se não houver biometria registrada
 */
export function BiometricLogin({ email, onSuccess, onError }: BiometricLoginProps) {
  const { isBiometryAvailable, isLoading, error, loginWithBiometry, registerBiometry, getDeviceName } = useBiometry();
  const [showBiometric, setShowBiometric] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    if (error && showRegistrationModal) {
      // Erro já é exibido no modal
      setDebugError(error);
    } else if (error && !showBiometric) {
      onError(error);
      setDebugError(error);
    }
  }, [error, showRegistrationModal, onError, showBiometric]);

  const handleBiometricLogin = async () => {
    if (!email) {
      const msg = 'Por favor, insira seu email primeiro';
      onError(msg);
      setDebugError(msg);
      return;
    }

    console.log('[BiometricLogin] Iniciando login com biometria para:', email);
    const user = await loginWithBiometry(email);
    
    console.log('[BiometricLogin] Resposta do servidor:', { user, error });
    
    if (user) {
      // Login bem-sucedido
      console.log('[BiometricLogin] Login bem-sucedido');
      onSuccess(user);
    } else if (!user) {
      // Sem biometria registrada - abrir modal automaticamente
      console.log('[BiometricLogin] Nenhuma biometria, abrindo modal de registro');
      setShowRegistrationModal(true);
      // Mostrar erro visível
      if (error) {
        setDebugError(error);
      }
    }
  };

  const handleRegisterBiometry = async () => {
    setIsRegistering(true);
    const deviceName = getDeviceName();
    console.log('[BiometricLogin] Iniciando registro de biometria para dispositivo:', deviceName);
    const success = await registerBiometry(email, deviceName);
    
    if (success) {
      console.log('[BiometricLogin] Registro bem-sucedido, fazendo login automático');
      setShowRegistrationModal(false);
      // Após registrar, faz login automaticamente
      const user = await loginWithBiometry(email);
      if (user) {
        onSuccess(user);
      }
    } else {
      console.log('[BiometricLogin] Erro ao registrar:', error);
      setDebugError(error || 'Erro ao registrar biometria. Verifique o console.');
    }
    setIsRegistering(false);
  };

  useEffect(() => {
    // Mostrar biometria apenas em dispositivos móveis
    const isMobile = isMobileDevice();
    setShowBiometric(isMobile && isBiometryAvailable && !!email);
    console.log('[BiometricLogin] Estado:', { isMobile, isBiometryAvailable, email: !!email, showBiometric: isMobile && isBiometryAvailable && !!email });
  }, [isBiometryAvailable, email]);

  if (!showBiometric) {
    return null;
  }

  return (
    <>
      {/* Debug Error Alert - Visível mesmo sem DevTools */}
      {debugError && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex gap-3 items-start">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">Erro</p>
            <p className="text-xs text-red-200 mt-1">{debugError}</p>
          </div>
          <button
            onClick={() => setDebugError(null)}
            className="text-red-400 hover:text-red-300 flex-shrink-0"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}
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

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-800 border border-neutral-700/50 rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Fingerprint size={24} className="text-emerald-400" strokeWidth={2.5} />
                  Registrar Biometria
                </h3>
                <p className="text-sm text-neutral-400 mt-1">
                  Nenhuma biometria registrada para este email
                </p>
              </div>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>

            {/* Device Info */}
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-200">
                <span className="font-semibold">Dispositivo detectado:</span> {getDeviceName()}
              </p>
              <p className="text-xs text-emerald-300 mt-1">
                Sua biometria será registrada automaticamente neste dispositivo
              </p>
            </div>

            {/* Error Message */}
            {(error || debugError) && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2 items-start">
                <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <p className="text-xs text-red-300">{error || debugError}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowRegistrationModal(false)}
                disabled={isRegistering || isLoading}
                className="flex-1 py-2.5 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-700 text-white font-semibold rounded-lg transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegisterBiometry}
                disabled={isRegistering || isLoading}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-600 text-white font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2"
              >
                {isRegistering || isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Registrando...
                  </>
                ) : (
                  <>
                    <Fingerprint size={18} strokeWidth={2.5} />
                    Registrar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
