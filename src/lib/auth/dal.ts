import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { isReadOnly, READ_ONLY_PATH } from './read-only'
import { LOGIN_PATH } from './routes'

/**
 * ページの保護用。JWT の署名と期限を検証する(getClaims)。
 * 速い代わりに、取り消されたセッションはアクセストークンが切れるまで通る。
 */
export const verifySession = cache(async () => {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) redirect(LOGIN_PATH)

  return {
    userId: data.claims.sub,
    email: data.claims.email,
    readOnly: isReadOnly(data.claims.app_metadata),
  }
})

/**
 * データを書き換える Server Action 用。毎回 Auth サーバーに問い合わせる(getUser)。
 * 取り消されたセッションも、すぐに拒否できる。
 * 閲覧専用のアカウントは、ここで止める(DB の RLS でも拒否される)。
 */
export async function requireUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) redirect(LOGIN_PATH)
  if (isReadOnly(data.user.app_metadata)) redirect(READ_ONLY_PATH)

  return data.user
}

/** 新規作成・編集の画面用。閲覧専用のアカウントには、フォームを見せずに案内する */
export async function verifyWritableSession() {
  const session = await verifySession()
  if (session.readOnly) redirect(READ_ONLY_PATH)
  return session
}
