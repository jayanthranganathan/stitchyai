/**
 * Firebase email/password auth helpers.
 *
 * Reuses the native @react-native-firebase/auth module already configured for
 * phone auth. Returns a Firebase ID token that the backend (/auth/firebase)
 * exchanges for our own JWT — the token carries the verified email.
 *
 * The native module is loaded LAZILY (require() inside the helper) so importing
 * this file never touches the native bridge — the app still boots in Expo Go.
 * Only works for real auth in a dev/standalone build (not Expo Go).
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

function authInstance(): FirebaseAuthTypes.Module {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  return (require('@react-native-firebase/auth').default as () => FirebaseAuthTypes.Module)();
}

/** Create a new email/password account, return a Firebase ID token. */
export async function signUpWithEmail(email: string, password: string): Promise<string> {
  const cred = await authInstance().createUserWithEmailAndPassword(email.trim(), password);
  return cred.user.getIdToken();
}

/** Sign in to an existing email/password account, return a Firebase ID token. */
export async function signInWithEmail(email: string, password: string): Promise<string> {
  const cred = await authInstance().signInWithEmailAndPassword(email.trim(), password);
  return cred.user.getIdToken();
}
