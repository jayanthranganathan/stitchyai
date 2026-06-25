/**
 * Firebase phone-verification flow helpers.
 *
 * Holds the pending ConfirmationResult between the PhoneLogin and OtpVerify
 * screens (navigation params must stay serialisable, so we keep it module-level).
 */

import {
  type ApplicationVerifier,
  type ConfirmationResult,
  signInWithPhoneNumber,
} from 'firebase/auth';

import { getFirebaseAuth } from './firebase';

let _pending: ConfirmationResult | null = null;

/** Send the SMS OTP via Firebase. `verifier` is the reCAPTCHA modal ref. */
export async function startPhoneVerification(
  phone: string,
  verifier: ApplicationVerifier,
): Promise<void> {
  _pending = await signInWithPhoneNumber(getFirebaseAuth(), phone, verifier);
}

/** Confirm the entered code and return a Firebase ID token for our backend. */
export async function confirmPhoneCode(code: string): Promise<string> {
  if (!_pending) {
    throw new Error('No phone verification in progress. Request a new code.');
  }
  const credential = await _pending.confirm(code);
  _pending = null;
  return credential.user.getIdToken();
}
