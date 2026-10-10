export function getSupabaseEnv(): { url: string; publishableKey: string } {
  // NEXT_PUBLIC_ の変数はビルド時に埋め込まれるため、process.env.XXX と直接書く必要がある
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !publishableKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください',
    )
  }
  return { url, publishableKey }
}

export type DemoAccount = { email: string; password: string }

/**
 * 公開デモの環境なら、共有する閲覧専用アカウントを返す。デモでなければ null。
 * パスワードはサーバー専用の環境変数に置き、画面には出さない(NEXT_PUBLIC_ を付けない)。
 */
export function getDemoAccount(): DemoAccount | null {
  if (process.env.DEMO_MODE !== 'true') return null
  const email = process.env.DEMO_EMAIL
  const password = process.env.DEMO_PASSWORD
  if (!email || !password) {
    throw new Error('DEMO_MODE=true のときは、DEMO_EMAIL と DEMO_PASSWORD を設定してください')
  }
  return { email, password }
}

export function isDemoMode(): boolean {
  return getDemoAccount() !== null
}

/** ログイン用リンクの戻り先の origin。Host ヘッダーは信用せず、環境変数から決める */
export function getSiteUrl(): string {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) throw new Error('SITE_URL を設定してください')
  return new URL(siteUrl).origin
}
