/**
 * Firebase phone-auth via the native @react-native-firebase/auth SDK.
 *
 * Google sends the SMS — no Indian DLT/GST registration required. On Android
 * this uses Play Integrity; on iOS it uses APNs. Only works in a dev/standalone
 * build (NOT Expo Go), since it relies on the native Firebase module.
 *
 * IMPORTANT: the native module is loaded LAZILY (require() inside the helper),
 * so merely importing this file never touches the native bridge. That lets the
 * app boot in Expo Go (which has no native Firebase) and fall back to the dev
 * OTP flow — Firebase only loads when these functions are actually called.
 */

import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

function authInstance(): FirebaseAuthTypes.Module {
  // Lazy require — only resolves the native module at call time.
  // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
  return (require('@react-native-firebase/auth').default as () => FirebaseAuthTypes.Module)();
}

let _confirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

/** Send the SMS OTP via Firebase. */
export async function startPhoneVerification(phone: string): Promise<void> {
  _confirmation = await authInstance().signInWithPhoneNumber(phone);
}

/** Confirm the entered code; returns a Firebase ID token for our backend. */
export async function confirmPhoneCode(code: string): Promise<string> {
  if (!_confirmation) {
    throw new Error('No phone verification in progress. Request a new code.');
  }
  const credential = await _confirmation.confirm(code);
  if (!credential?.user) {
    throw new Error('Verification failed.');
  }
  const token = await credential.user.getIdToken();
  _confirmation = null;
  return token;
}
