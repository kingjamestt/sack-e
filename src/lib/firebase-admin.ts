import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

function formatPrivateKey(key: string) {
  return key.replace(/\\n/g, '\n');
}

let app: App;

if (!getApps().length) {
  try {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
        }),
      });
    } else {
      // Fallback to application default credentials
      app = initializeApp();
    }
  } catch (error) {
    console.error('Firebase Admin Initialization Error:', error);
    // Initialize dummy app to prevent complete crash on build time if env vars are missing
    app = initializeApp({ projectId: 'dummy-project' }, 'dummy');
  }
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app);
