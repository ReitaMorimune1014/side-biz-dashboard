import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type TestUser = { client: SupabaseClient; userId: string }

/** アプリと同じ publishable key で作る。service_role key は使わない */
export function createAnonClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください(npx supabase status -o env)',
    )
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** 毎回別のユーザーを作り、ログイン済みのクライアントを返す */
export async function signUpTestUser(): Promise<TestUser> {
  const client = createAnonClient()
  const { data, error } = await client.auth.signUp({
    email: `rls-${crypto.randomUUID()}@example.com`,
    password: crypto.randomUUID(),
  })
  if (error) throw error
  if (!data.session || !data.user) {
    throw new Error('signUp でセッションが得られませんでした。auth.email.enable_confirmations を確認してください')
  }
  return { client, userId: data.user.id }
}
