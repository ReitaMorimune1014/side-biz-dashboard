import { Client } from 'pg'

const DEFAULT_DB_URL = 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1', '[::1]'])

/**
 * ローカルの Supabase(npx supabase start)の DB に、管理者として直接つなぐ。
 * app_metadata のように、利用者の API では変えられない値を準備するためだけに使う。
 * 本番の DB を書き換えないように、ローカル以外の接続先は拒否する。
 */
async function withLocalDb<T>(run: (db: Client) => Promise<T>): Promise<T> {
  const url = process.env.SUPABASE_DB_URL ?? DEFAULT_DB_URL
  if (!LOCAL_HOSTS.has(new URL(url).hostname)) {
    throw new Error(`ローカル以外の DB には接続しません: ${new URL(url).hostname}`)
  }
  const db = new Client({ connectionString: url })
  await db.connect()
  try {
    return await run(db)
  } finally {
    await db.end()
  }
}

/** ユーザーを閲覧専用にする。反映には、セッションの更新(新しい JWT)が必要 */
export async function markReadOnly(userId: string): Promise<void> {
  await withLocalDb(async (db) => {
    const result = await db.query(
      `update auth.users
          set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"read_only": true}'::jsonb
        where id = $1`,
      [userId],
    )
    if (result.rowCount !== 1) throw new Error(`ユーザーが見つかりません: ${userId}`)
  })
}
