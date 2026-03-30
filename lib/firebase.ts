import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getStorage, FirebaseStorage } from 'firebase/storage';
// @ts-ignore
import { getReactNativePersistence } from 'firebase/auth/react-native';
import { initializeAuth, Auth, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig, isFirebaseConfigured } from '@/utils/firebase-config';

let app: FirebaseApp | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
    if (getApps().length > 0) {
        app = getApp();
        storage = getStorage(app);
        auth = getAuth(app);
    } else {
        app = initializeApp(firebaseConfig);
        storage = getStorage(app);
        auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage),
        });
        console.log('Firebase initialized with new app instance');
    }
} else {
    console.warn('Firebase configuration missing or incomplete');
}

export const firebaseApp = app;
export const firebaseStorage = storage;
export const firebaseAuth = auth;

export const assertFirebaseStorage = () => {
  if (!firebaseStorage) {
    throw new Error(
      'Firebase Storage is not configured. Set EXPO_PUBLIC_FIREBASE_* env vars.'
    );
  }
  return firebaseStorage;
};

export const assertFirebaseAuth = () => {
    if (!firebaseAuth) {
        throw new Error('Firebase Auth is not configured.');
    }
    return firebaseAuth;
};
