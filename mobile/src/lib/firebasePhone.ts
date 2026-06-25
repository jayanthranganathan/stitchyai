/**
 * Firebase phone-auth via the native @react-native-firebase/auth SDK.
 *
 * Google sends the SMS — no Indian DLT/GST registration required. On Android
 * this uses Play Integrity (usually no visible reCAPTCHA); on iOS it uses APNs
 * silent push. Only works in a dev/standalone build (NOT Expo Go), since it
 * relies on the native Firebase module + google-services.json.
 *
 * The module is imported dynamically so this file is safe to import in Expo Go
 * (the native bridge is only touched when these functions actually run).
 */

import auth, { type FirebaseAuthTypes } from '@react-native-firebase/auth';

let _confirmation: FirebaseAuthTypes.ConfirmationResult | null = null;

/** Send the SMS OTP via Firebase. */
export async function startPhoneVerification(phone: string): Promise<void> {
  _confirmation = await auth().signInWithPhoneNumber(phone);
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
