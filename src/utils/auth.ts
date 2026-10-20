/** Form rules shared by sign-up, sign-in and Settings — the same ones the server enforces. */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** 8+ characters with at least one letter and one number; null when the password is fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.'
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return 'Use at least one letter and one number.'
  if (password.trim() !== password) return "The password can't start or end with a space."
  return null
}

/** Only follow in-app paths after signing in — never an external URL from the query string. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'
}
