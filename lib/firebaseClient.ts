import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED_KEYS: (keyof typeof firebaseConfig)[] = ['apiKey', 'projectId', 'appId'];

export const isFirebaseConfigured = REQUIRED_KEYS.every((key) => !!firebaseConfig[key]);

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase configuration is missing. Please set NEXT_PUBLIC_FIREBASE_* environment variables.');
  }

  if (cachedApp) {
    return cachedApp;
  }

  cachedApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return cachedApp;
}

export function getFirebaseApp(): FirebaseApp {
  return ensureApp();
}

export function getFirebaseAuth(): Auth {
  if (!cachedAuth) {
    cachedAuth = getAuth(ensureApp());
  }
  return cachedAuth;
}

export function getFirebaseDb(): Firestore {
  if (!cachedDb) {
    cachedDb = getFirestore(ensureApp());
  }
  return cachedDb;
}


