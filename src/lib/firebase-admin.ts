import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let adminAppInstance: App | null = null;
let adminAuthInstance: Auth | null = null;

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    if (!getApps().length) {
      const projectId = 
        process.env.FIREBASE_PROJECT_ID || 
        process.env.VITE_FIREBASE_PROJECT_ID || 
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 
        firebaseConfig.projectId;

      adminAppInstance = initializeApp({
        projectId: projectId,
      });
    } else {
      adminAppInstance = getApps()[0];
    }
    adminAuthInstance = getAuth(adminAppInstance);
  }
  return adminAuthInstance;
}

