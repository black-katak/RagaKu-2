import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as authModule from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Helper to determine persistence based on platform
const getAuthPersistence = () => {
  if (Platform.OS === 'web') {
    return authModule.browserLocalPersistence;
  }
  const getRNPersistence = (authModule as any).getReactNativePersistence;
  return getRNPersistence ? getRNPersistence(AsyncStorage) : authModule.browserLocalPersistence;
};

export const auth = authModule.initializeAuth(app, {
  persistence: getAuthPersistence(),
});

export const db = getFirestore(app);