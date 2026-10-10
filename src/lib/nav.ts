export const MAIN_LINKS = [
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/projects', label: '案件' },
  { href: '/money', label: 'お金' },
  { href: '/time', label: '稼働' },
  { href: '/customers', label: '顧客' },
  { href: '/settings', label: '設定' },
] as const

/** 今の画面がそのリンクの中か(/projects/board や /projects/xxx/edit も「案件」に含める) */
export function isCurrentPath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
