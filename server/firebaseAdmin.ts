import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import firebaseConfig from '../firebase-applet-config.json';

// Verifica se existem credenciais de conta de serviço configuradas no ambiente.
// Em produção (Cloud Run / AI Studio), as credenciais são injetadas automaticamente
// pelo ambiente do Google Cloud, então essa checagem cobre também o caso local.
function hasAdminCredentials(): boolean {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const isGcpRuntime = !!process.env.K_SERVICE || !!process.env.FUNCTION_TARGET; // Cloud Run / Cloud Functions
  return !!(credPath && fs.existsSync(credPath)) || isGcpRuntime;
}

function getAdminApp() {
  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || firebaseConfig.projectId;
    initializeApp({
      projectId,
      storageBucket: (firebaseConfig as any).storageBucket
    });
  }
  return getApps()[0];
}

/**
 * Retorna a instância do Firestore (via Admin SDK) ou null se não houver
 * credenciais disponíveis no ambiente atual (ex: dev local sem service account).
 */
export function getAdminDb(): Firestore | null {
  if (!hasAdminCredentials()) {
    console.warn('[firebaseAdmin] Sem credenciais de service account disponíveis — operações no Firestore serão puladas.');
    return null;
  }
  try {
    const app = getAdminApp();
    const dbId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
    try {
      return getFirestore(app, dbId);
    } catch {
      return getFirestore(app);
    }
  } catch (e) {
    console.error('[firebaseAdmin] Falha ao inicializar Firestore Admin:', e);
    return null;
  }
}
