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

/** ログイン用リンクの戻り先の origin。Host ヘッダーは信用せず、環境変数から決める */
export function getSiteUrl(): string {
  const siteUrl = process.env.SITE_URL
  if (!siteUrl) throw new Error('SITE_URL を設定してください')
  return new URL(siteUrl).origin
}
