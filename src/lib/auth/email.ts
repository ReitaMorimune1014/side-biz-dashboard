const MAX_EMAIL_LENGTH = 254

/** ログイン用リンクを送る前の最低限の形式チェック。厳密な検証は Supabase Auth に任せる */
export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
