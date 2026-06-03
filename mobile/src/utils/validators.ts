const PHONE_RE = /^\+?[1-9]\d{7,14}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validators = {
  phone: (value: string): boolean => PHONE_RE.test(value),
  email: (value: string): boolean => EMAIL_RE.test(value),
  otp: (value: string): boolean => /^\d{4,8}$/.test(value),
};
