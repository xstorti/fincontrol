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

/**
 * Detectar nome do dispositivo automaticamente
 */
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

/**
 * Converter base64url string para ArrayBuffer
 * SimpleWebAuthn usa base64url encoding para challenge e IDs
 * Base64url: - em vez de +, _ em vez de /, sem padding =
 */
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  // Converter base64url para base64 padrão
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Adicionar padding se necessário
  const padding = 4 - (base64.length % 4);
  if (padding !== 4) {
    base64 += '='.repeat(padding);
  }
  
  // Converter base64 para string binária
  const binaryString = atob(base64);
  // Converter para Uint8Array
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
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

      const finalDeviceName = deviceName || getDeviceName();
      console.log('[useBiometry] Iniciando registerBiometry para:', { email, deviceName: finalDeviceName });

      // 1. Gerar opções de registro
      const optionsRes = await fetch('/api/auth/webauthn/register/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include',
      });

      if (!optionsRes.ok) {
        const errorData = await optionsRes.json();
        console.error('[useBiometry] Erro ao gerar opções:', errorData);
        throw new Error('Erro ao gerar opções de registro');
      }

      const responseData = await optionsRes.json();
      console.log('[useBiometry] Resposta da API:', responseData);
      
      const { data } = responseData;
      if (!data || !data.options) {
        throw new Error('Resposta inválida da API: falta options');
      }

      console.log('[useBiometry] Estrutura de options:', Object.keys(data.options));
      console.log('[useBiometry] Challenge existe?', !!data.options.challenge);
      console.log('[useBiometry] Challenge tipo:', typeof data.options.challenge, 'tamanho:', data.options.challenge?.length);
      console.log('[useBiometry] Challenge primeiros 20 chars:', String(data.options.challenge).substring(0, 20));

      // Converter challenge de base64url para ArrayBuffer
      let challengeArrayBuffer;
      try {
        challengeArrayBuffer = base64urlToArrayBuffer(data.options.challenge);
        console.log('[useBiometry] Challenge convertido para ArrayBuffer, tamanho:', challengeArrayBuffer.byteLength);
      } catch (e) {
        console.error('[useBiometry] Erro ao converter challenge:', e);
        throw new Error('Challenge em formato inválido');
      }

      // Converter user.id de base64url para ArrayBuffer também!
      let userIdArrayBuffer;
      try {
        userIdArrayBuffer = base64urlToArrayBuffer(data.options.user.id);
        console.log('[useBiometry] User ID convertido para ArrayBuffer, tamanho:', userIdArrayBuffer.byteLength);
      } catch (e) {
        console.error('[useBiometry] Erro ao converter user.id:', e);
        throw new Error('User ID em formato inválido');
      }

      // Criar opções com challenge, user.id e credenciais corretos
      const optionsWithArrayBuffer = {
        ...data.options,
        challenge: challengeArrayBuffer,
        user: {
          ...data.options.user,
          id: userIdArrayBuffer,
        },
      };

      // 2. Iniciar fluxo de registro WebAuthn
      console.log('[useBiometry] Opções obtidas, iniciando registro WebAuthn');

      // 2. Iniciar fluxo de registro WebAuthn
      let attestationResponse;
      try {
        console.log('[useBiometry] Chamando startRegistration com options:', {
          challenge: typeof optionsWithArrayBuffer.challenge,
          user: { id: typeof optionsWithArrayBuffer.user.id, name: optionsWithArrayBuffer.user.name },
        });
        attestationResponse = await startRegistration(optionsWithArrayBuffer);
        console.log('[useBiometry] Registro bem-sucedido, enviando para servidor');
        console.log('[useBiometry] Credential ID tipo:', typeof attestationResponse.id, 'tamanho:', attestationResponse.id?.length);
        console.log('[useBiometry] Credential ID valor:', attestationResponse.id);
        console.log('[useBiometry] Attestation response completo:', JSON.stringify(attestationResponse, null, 2).substring(0, 500));
      } catch (regError: any) {
        console.error('[useBiometry] Erro ao chamar startRegistration:', regError);
        throw new Error(`Erro ao registrar biometria: ${regError.message}`);
      }

      // 3. Verificar resposta no servidor
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
      const errorMessage = err.message || 'Erro ao registrar biometria';
      console.error('[useBiometry] Erro completo:', err);
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

      console.log('[useBiometry] Iniciando loginWithBiometry para:', email);

      // 1. Gerar opções de autenticação
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
        console.log('[useBiometry] Erro ao gerar opções:', errorMsg);
        
        // Se não tiver biometria registrada, retorna null para que o componente abra o modal de registro
        if (errorMsg.includes('Nenhuma biometria') || optionsRes.status === 404) {
          console.log('[useBiometry] Nenhuma biometria registrada - retornando null');
          setError('Nenhuma biometria registrada para este usuário');
          setIsLoading(false);
          return null;
        }
        throw new Error(errorMsg);
      }

      const responseData = await optionsRes.json();
      console.log('[useBiometry] Resposta de opções recebida');
      
      const { data } = responseData;
      if (!data || !data.options) {
        throw new Error('Resposta inválida da API: falta options');
      }

      // Converter challenge de base64url para ArrayBuffer
      const challengeArrayBuffer = base64urlToArrayBuffer(data.options.challenge);
      console.log('[useBiometry] Challenge convertido para ArrayBuffer, tamanho:', challengeArrayBuffer.byteLength);

      // Converter allowCredentials id's de base64url para ArrayBuffer também
      const convertedAllowCredentials = (data.options.allowCredentials || []).map((cred: any) => {
        try {
          return {
            ...cred,
            id: typeof cred.id === 'string' ? base64urlToArrayBuffer(cred.id) : cred.id,
          };
        } catch (e) {
          console.error('[useBiometry] Erro ao converter credential ID:', cred.id, e);
          throw e;
        }
      });

      // Criar opções com challenge e credenciais corretos
      const optionsWithArrayBuffer = {
        ...data.options,
        challenge: challengeArrayBuffer,
        allowCredentials: convertedAllowCredentials,
      };

      // 2. Iniciar fluxo de autenticação WebAuthn
      console.log('[useBiometry] Iniciando autenticação WebAuthn');
      console.log('[useBiometry] Options challenge tipo:', typeof optionsWithArrayBuffer.challenge);
      console.log('[useBiometry] AllowCredentials convertidos:', convertedAllowCredentials.length);
      let assertionResponse;
      try {
        assertionResponse = await startAuthentication(optionsWithArrayBuffer);
        console.log('[useBiometry] Autenticação bem-sucedida, enviando para servidor');
        console.log('[useBiometry] Credential ID tipo:', typeof assertionResponse.id, 'tamanho:', assertionResponse.id?.length);
        console.log('[useBiometry] Credential ID valor:', assertionResponse.id);
        console.log('[useBiometry] UserId que será enviado:', data.userId);
      } catch (authError: any) {
        console.error('[useBiometry] Erro ao chamar startAuthentication:', authError);
        throw new Error(`Erro ao autenticar: ${authError.message}`);
      }

      // 3. Verificar resposta no servidor (faz login)
      console.log('[useBiometry] Enviando para verify com userId:', data.userId, 'credential.id:', assertionResponse.id);
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
      console.log('[useBiometry] Login bem-sucedido');
      setIsLoading(false);
      return userData.data;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao fazer login com biometria';
      console.error('[useBiometry] Erro:', errorMessage);
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
    getDeviceName,
  };
}
