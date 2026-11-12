import { useCallback, useState } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

export interface UseBiometryReturn {
  isBiometryAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  registerBiometry: (email: string, deviceName?: string) => Promise<boolean>;
  loginWithBiometry: (email: string) => Promise<{ id: string; email: string; nome: string; tipo_usuario: string; senha_temporaria: boolean } | null>;
  getDeviceName: () => string;
}

function getDeviceName(): string {
  if (typeof window === 'undefined') return 'Dispositivo';
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua)) {
    if (/SM-/.test(ua)) return 'Samsung Galaxy';
    if (/Pixel/.test(ua)) return 'Google Pixel';
    return 'Android';
  }
  if (/Mac/.test(ua)) return 'MacBook';
  if (/Windows/.test(ua)) return 'Windows PC';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Dispositivo';
}

export function useBiometry(): UseBiometryReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBiometryAvailable = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return typeof window.PublicKeyCredential !== 'undefined' &&
           typeof navigator.credentials !== 'undefined' &&
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';
  }, []);

  const registerBiometry = useCallback(async (email: string, deviceName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isBiometryAvailable()) {
        throw new Error('Biometria nao e suportada neste dispositivo');
      }

      const finalDeviceName = deviceName || getDeviceName();
      console.log('[useBiometry] Iniciando registerBiometry para:', { email, deviceName: finalDeviceName });

      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!optionsRes.ok) {
        const errorData = await optionsRes.json();
        console.error('[useBiometry] Erro ao gerar opcoes:', errorData);
        throw new Error(errorData.error || 'Erro ao gerar opcoes de registro');
      }

      const responseData = await optionsRes.json();
      const { data } = responseData;
      if (!data?.options) throw new Error('Resposta invalida da API: falta options');

      console.log('[useBiometry] Options recebidas, challenge:', data.options.challenge?.substring(0, 20));

      let attestationResponse;
      try {
        // SimpleWebAuthn v14: usar { optionsJSON: options }
        attestationResponse = await startRegistration({ optionsJSON: data.options });
        console.log('[useBiometry] startRegistration OK, credential ID:', attestationResponse.id);
      } catch (regError: any) {
        console.error('[useBiometry] Erro startRegistration:', regError.message);
        throw new Error(`Erro ao registrar biometria: ${regError.message}`);
      }

      const verifyRes = await fetch('/api/auth/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          credential: attestationResponse,
          deviceName: finalDeviceName,
        }),
        credentials: 'include',
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        console.error('[useBiometry] Erro ao verificar registro:', errorData);
        throw new Error(errorData.error || 'Erro ao registrar biometria');
      }

      console.log('[useBiometry] Biometria registrada com sucesso');
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('[useBiometry] Erro completo:', err.message);
      setError(err.message || 'Erro ao registrar biometria');
      setIsLoading(false);
      return false;
    }
  }, [isBiometryAvailable]);

  const loginWithBiometry = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isBiometryAvailable()) {
        throw new Error('Biometria nao e suportada neste dispositivo');
      }

      console.log('[useBiometry] Iniciando loginWithBiometry para:', email);

      const optionsRes = await fetch('/api/auth/webauthn/authenticate/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      console.log('[useBiometry] Response status:', optionsRes.status);

      if (!optionsRes.ok) {
        const errorData = await optionsRes.json();
        const errorMsg = errorData.error || `HTTP ${optionsRes.status}`;
        console.log('[useBiometry] Erro ao gerar opcoes:', errorMsg);

        if (errorMsg.includes('Nenhuma biometria') || optionsRes.status === 404) {
          console.log('[useBiometry] Nenhuma biometria registrada - retornando null');
          setError('Nenhuma biometria registrada para este usuario');
          setIsLoading(false);
          return null;
        }
        throw new Error(errorMsg);
      }

      const responseData = await optionsRes.json();
      const { data } = responseData;
      if (!data?.options) throw new Error('Resposta invalida da API: falta options');

      console.log('[useBiometry] Options de autenticacao recebidas, challenge:', data.options.challenge?.substring(0, 20));

      let assertionResponse;
      try {
        // SimpleWebAuthn v14: usar { optionsJSON: options }
        assertionResponse = await startAuthentication({ optionsJSON: data.options });
        console.log('[useBiometry] startAuthentication OK, credential ID:', assertionResponse.id);
      } catch (authError: any) {
        console.error('[useBiometry] Erro startAuthentication:', authError.message);
        throw new Error(`Erro ao autenticar: ${authError.message}`);
      }

      console.log('[useBiometry] Enviando verify, userId:', data.userId, 'credential.id:', assertionResponse.id);
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
        throw new Error(errorData.error || 'Erro na autenticacao biometrica');
      }

      const userData = await verifyRes.json();
      console.log('[useBiometry] Login bem-sucedido');
      setIsLoading(false);
      return userData.data;
    } catch (err: any) {
      console.error('[useBiometry] Erro:', err.message);
      setError(err.message || 'Erro ao fazer login com biometria');
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
    getDeviceName,
  };
}
