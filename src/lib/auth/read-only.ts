/** 閲覧専用のアカウントに書き込みを試みたとき、案内する場所 */
export const READ_ONLY_PATH = '/read-only'

/**
 * 閲覧専用のアカウントかどうか。
 * app_metadata は管理者だけが書き換えられるので、本人が自分で外すことはできない。
 * (user_metadata は本人が書き換えられるので、権限の判定には使わない)
 * DB 側も同じ値で判定している(public.is_read_only)。
 */
export function isReadOnly(appMetadata: unknown): boolean {
  if (typeof appMetadata !== 'object' || appMetadata === null) return false
  return (appMetadata as Record<string, unknown>).read_only === true
}
