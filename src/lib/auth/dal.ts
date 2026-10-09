import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { LOGIN_PATH } from './routes'

/**
 * ページの保護用。JWT の署名と期限を検証する(getClaims)。
 * 速い代わりに、取り消されたセッションはアクセストークンが切れるまで通る。
 */
export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect(LOGIN_PATH)

  return { userId: data.claims.sub, email: data.claims.email }
})

/**
 * データを書き換える Server Action 用。毎回 Auth サーバーに問い合わせる(getUser)。
 * 取り消されたセッションも、すぐに拒否できる。
 */
export async function requireUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) redirect(LOGIN_PATH)

  return data.user
}
