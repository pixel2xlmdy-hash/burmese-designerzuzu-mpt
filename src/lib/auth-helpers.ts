// Pure helpers for sign-in: email-or-phone identities and the 6-digit code attempt limit.
import { toAsciiDigits } from "./tailor";

/** Phone accounts sign in with a private address on this domain; it never receives mail. */
export const PHONE_EMAIL_DOMAIN = "phone.myaukpyinthu.app";
export const MIN_PASSWORD = 6;
export const OTP_LENGTH = 6;
export const OTP_MAX_ATTEMPTS = 6;
export const OTP_COOLDOWN_MS = 2 * 60 * 1000;

/** Normalizes a Myanmar phone number: "+95 9 7891 04156", "၀၉၇၈၉..." → "09789104156". */
export function normalizePhone(input: string): string {
  let digits = toAsciiDigits(input).replace(/\D/g, "");
  if (digits.startsWith("959")) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("9")) digits = `0${digits}`;
  return digits;
}

/** Turns what the user typed (email or phone number) into the sign-in email. Null when neither. */
export function loginIdentity(input: string): { email: string; kind: "email" | "phone" } | null {
  const v = input.trim();
  if (v.includes("@")) {
    const email = v.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { email, kind: "email" } : null;
  }
  const phone = normalizePhone(v);
  if (phone.length < 7 || phone.length > 15) return null;
  return { email: `${phone}@${PHONE_EMAIL_DOMAIN}`, kind: "phone" };
}

/** What to show for the signed-in account: the phone number for phone accounts, else the email. */
export function accountLabel(email: string | null): string {
  if (!email) return "";
  const suffix = `@${PHONE_EMAIL_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

export interface OtpGate {
  failures: number;
  lockedUntil: number; // epoch ms, 0 = not locked
}

export const OTP_GATE_OPEN: OtpGate = { failures: 0, lockedUntil: 0 };

/** Milliseconds left in the cooldown (0 when the code can be tried). */
export function otpLockRemaining(gate: OtpGate, now: number): number {
  return Math.max(0, gate.lockedUntil - now);
}

/** Counts a wrong code; the 5th wrong code starts the cooldown and resets the count. */
export function otpRecordFailure(gate: OtpGate, now: number): OtpGate {
  const failures = gate.failures + 1;
  if (failures >= OTP_MAX_ATTEMPTS) return { failures: 0, lockedUntil: now + OTP_COOLDOWN_MS };
  return { failures, lockedUntil: 0 };
}
