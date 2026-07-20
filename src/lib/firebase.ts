import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

/**
 * Firebase configuration object populated from environment variables.
 * Contains essential credentials and endpoints required to connect to the Firebase project.
 */
const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/**
 * The initialized Firebase application instance.
 * It checks if an app is already initialized to avoid duplicate initializations (e.g., during hot-reloads).
 */
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * The Firebase Authentication service instance.
 */
const auth = getAuth(app);

/**
 * The Cloud Firestore database service instance.
 */
const db = getFirestore(app);

if (typeof window !== "undefined") {
  enableMultiTabIndexedDbPersistence(db).catch((err) => {
    console.warn("Could not enable offline persistence:", err);
  });
}

/**
 * The Firebase Cloud Storage service instance.
 */
const storage = getStorage(app);

/**
 * The Firebase Analytics service instance.
 */
let analytics: any = null;
if (typeof window !== "undefined") {
  isSupported().then((yes) => yes && (analytics = getAnalytics(app)));
}

export { app, auth, db, storage, analytics };
