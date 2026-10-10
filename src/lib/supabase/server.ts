import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseEnv } from '@/lib/env'

/** Server Component・Server Action・Route Handler 用。リクエストごとに作り直す */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, publishableKey } = getSupabaseEnv()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Component からは Cookie を書けない。トークンの更新は proxy.ts が行う
        }
      },
    },
  })
}
