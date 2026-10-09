const MAX_EMAIL_LENGTH = 254

/** ログイン用リンクを送る前の最低限の形式チェック。厳密な検証は Supabase Auth に任せる */
export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > MAX_EMAIL_LENGTH) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export type LoginFieldErrors = { email?: string }

/** ログインフォームのメールアドレス。前後の空白は除く */
export function parseLoginEmail(
  value: unknown,
): { success: true; data: string } | { success: false; fieldErrors: LoginFieldErrors } {
  const email = typeof value === 'string' ? value.trim() : ''
  if (email === '') {
    return { success: false, fieldErrors: { email: 'メールアドレスを入力してください' } }
  }
  if (!isValidEmail(email)) {
    return { success: false, fieldErrors: { email: 'メールアドレスの形式が正しくありません' } }
  }
  return { success: true, data: email }
}
