import { useCallback, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export interface UseBiometryReturn {
  isBiometryAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  registerBiometry: (email: string, deviceName?: string) => Promise<boolean>;
  loginWithBiometry: (email: string) => Promise<{ id: string; email: string; nome: string; tipo_usuario: string; senha_temporaria: boolean } | null>;
}

/**
 * Hook para gerenciar autenticação biométrica WebAuthn
 */
export function useBiometry(): UseBiometryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o dispositivo suporta biometria
  const isBiometryAvailable = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return typeof window.PublicKeyCredential !== 'undefined' &&
           typeof navigator.credentials !== 'undefined' &&
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  }, []);

  // Registrar biometria
  const registerBiometry = useCallback(async (email: string, deviceName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isBiometryAvailable()) {
        throw new Error('Biometria não é suportada neste dispositivo');
      }

      // 1. Gerar opções de registro
      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!optionsRes.ok) {
        throw new Error('Erro ao gerar opções de registro');
      }

      const { data } = await optionsRes.json();

      // 2. Iniciar fluxo de registro WebAuthn
      const attestationResponse = await startRegistration(data.options);

      // 3. Verificar resposta no servidor
      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          credential: attestationResponse,
          deviceName: deviceName || 'Meu Dispositivo',
        }),
        credentials: 'include',
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Erro ao registrar biometria');
      }

      setIsLoading(false);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao registrar biometria';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  }, [isBiometryAvailable]);

  // Login com biometria
  const loginWithBiometry = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isBiometryAvailable()) {
        throw new Error('Biometria não é suportada neste dispositivo');
      }

      // 1. Gerar opções de autenticação
      const optionsRes = await fetch('/api/auth/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!optionsRes.ok) {
        const errorData = await optionsRes.json();
        throw new Error(errorData.error || 'Erro ao gerar opções de autenticação');
      }

      const { data } = await optionsRes.json();

      // 2. Iniciar fluxo de autenticação WebAuthn
      const assertionResponse = await startAuthentication(data.options);

      // 3. Verificar resposta no servidor (faz login)
      const verifyRes = await fetch('/api/auth/webauthn/authenticate/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          credential: assertionResponse,
        }),
        credentials: 'include',
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || 'Erro na autenticação biométrica');
      }

      const userData = await verifyRes.json();
      setIsLoading(false);
      return userData.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login com biometria';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  }, [isBiometryAvailable]);

  return {
    isBiometryAvailable: isBiometryAvailable(),
    isLoading,
    error,
    registerBiometry,
    loginWithBiometry,
  };
}
