/**
 * Firebase phone-auth bootstrap.
 *
 * Google sends the SMS OTP — no Indian DLT/GST registration is required.
 * Config comes from EXPO_PUBLIC_FIREBASE_* env vars (see app.config.ts → extra).
 *
 * NOTE: phone auth uses a reCAPTCHA verifier, so it only works on an EAS dev
 * build (not Expo Go). When Firebase is not configured, `isFirebaseConfigured`
 * is false and the app falls back to the dev OTP flow (code 123456).
 */

import Constants from 'expo-constants';
import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, getAuth } from 'firebase/auth';

type FirebaseExtra = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

const cfg = (Constants.expoConfig?.extra?.firebase ?? {}) as Partial<FirebaseExtra>;

export const isFirebaseConfigured = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let _app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured (set EXPO_PUBLIC_FIREBASE_* env vars).');
  }
  if (_app) return _app;
  _app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: cfg.apiKey!,
        authDomain: cfg.authDomain!,
        projectId: cfg.projectId!,
        appId: cfg.appId!,
      });
  return _app;
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}
