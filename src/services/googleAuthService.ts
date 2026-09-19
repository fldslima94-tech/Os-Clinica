import firebaseConfig from '../../firebase-applet-config.json';

// Scopes necessários
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.events';
export const ALL_WORKSPACE_SCOPES = `${GOOGLE_DRIVE_SCOPE} ${GOOGLE_CALENDAR_SCOPE}`;

const STORAGE_KEY_TOKEN = 'aura_google_workspace_token';
const STORAGE_KEY_EXPIRY = 'aura_google_workspace_expiry';
const STORAGE_KEY_SCOPES = 'aura_google_workspace_scopes';

export interface GoogleWorkspaceAuthState {
  accessToken: string | null;
  expiresAt: number | null;
  hasDriveAccess: boolean;
  hasCalendarAccess: boolean;
  isConnected: boolean;
}

export function getGoogleClientId(): string {
  const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) ? (import.meta as any).env : {};
  return (
    env.VITE_GOOGLE_CLIENT_ID ||
    (firebaseConfig as any).oAuthClientId ||
    ''
  );
}

export function getStoredWorkspaceAuth(): GoogleWorkspaceAuthState {
  try {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiryStr = localStorage.getItem(STORAGE_KEY_EXPIRY);
    const scopesStr = localStorage.getItem(STORAGE_KEY_SCOPES) || '';

    if (!token || !expiryStr) {
      return {
        accessToken: null,
        expiresAt: null,
        hasDriveAccess: false,
        hasCalendarAccess: false,
        isConnected: false,
      };
    }

    const expiresAt = parseInt(expiryStr, 10);
    // Margem de segurança de 60 segundos
    if (Date.now() > expiresAt - 60000) {
      clearWorkspaceAuth();
      return {
        accessToken: null,
        expiresAt: null,
        hasDriveAccess: false,
        hasCalendarAccess: false,
        isConnected: false,
      };
    }

    const hasDrive = scopesStr.includes('drive.file');
    const hasCal = scopesStr.includes('calendar.events');

    return {
      accessToken: token,
      expiresAt,
      hasDriveAccess: hasDrive,
      hasCalendarAccess: hasCal,
      isConnected: true,
    };
  } catch {
    return {
      accessToken: null,
      expiresAt: null,
      hasDriveAccess: false,
      hasCalendarAccess: false,
      isConnected: false,
    };
  }
}

export function clearWorkspaceAuth() {
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRY);
    localStorage.removeItem(STORAGE_KEY_SCOPES);
  } catch {}
}

/**
 * Solicita token de acesso usando o Google Identity Services (GSI) no cliente
 */
export async function requestGoogleWorkspaceToken(
  scopes: string = ALL_WORKSPACE_SCOPES
): Promise<{ accessToken: string; expiresIn: number }> {
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error('Google Client ID não encontrado na configuração.');
  }

  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(
        new Error(
          'Google Identity Services SDK ainda não carregou no navegador. Aguarde alguns segundos e tente novamente.'
        )
      );
      return;
    }

    try {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: scopes,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }

          const accessToken = response.access_token;
          const expiresIn = parseInt(response.expires_in, 10) || 3600;
          const expiresAt = Date.now() + expiresIn * 1000;

          localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);
          localStorage.setItem(STORAGE_KEY_EXPIRY, expiresAt.toString());
          localStorage.setItem(STORAGE_KEY_SCOPES, response.scope || scopes);

          resolve({ accessToken, expiresIn });
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      reject(err);
    }
  });
}

/**
 * Garante que temos um token válido para as operações
 */
export async function getValidAccessToken(
  requiredScope: string = ALL_WORKSPACE_SCOPES
): Promise<string> {
  const auth = getStoredWorkspaceAuth();
  if (auth.accessToken && auth.isConnected) {
    return auth.accessToken;
  }
  const result = await requestGoogleWorkspaceToken(requiredScope);
  return result.accessToken;
}
