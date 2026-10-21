import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  sendPasswordResetEmail,
  verifyPasswordResetCode,
  confirmPasswordReset,
  type Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
};

export const getFirebaseApp = (): FirebaseApp | null => {
  if (!isFirebaseConfigured()) return null;
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
};

export const getFirebaseAuth = (): Auth | null => {
  const app = getFirebaseApp();
  if (!app) return null;
  return getAuth(app);
};

/**
 * Send password reset email directly via Firebase Authentication
 * Sends directly to user's inbox using Firebase's deliverability network.
 */
export const sendFirebasePasswordReset = async (email: string, customRedirectUrl?: string) => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured yet. Please configure Firebase API keys.');
  }

  const liveOrigin =
    customRedirectUrl ||
    (typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : 'https://dexartechnologies.in');

  const actionCodeSettings = {
    url: `${liveOrigin}/reset-password`,
    handleCodeInApp: true,
  };

  return await sendPasswordResetEmail(auth, email.trim().toLowerCase(), actionCodeSettings);
};

/**
 * Verify Firebase reset oobCode and return associated email
 */
export const verifyFirebaseCode = async (oobCode: string): Promise<string> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured.');
  }
  return await verifyPasswordResetCode(auth, oobCode);
};

/**
 * Complete password reset using Firebase oobCode
 */
export const confirmFirebaseReset = async (oobCode: string, newPassword: string): Promise<void> => {
  const auth = getFirebaseAuth();
  if (!auth) {
    throw new Error('Firebase Authentication is not configured.');
  }
  return await confirmPasswordReset(auth, oobCode, newPassword);
};
