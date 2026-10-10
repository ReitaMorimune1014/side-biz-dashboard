import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { weeklyUsage } from '@/lib/weekly/usage'
import { WeeklySummary } from './weekly-summary'

const range = { start: '2026-10-05', end: '2026-10-11' }

function renderSummary(totalMinutes: number) {
  render(<WeeklySummary usage={weeklyUsage(totalMinutes, 300)} range={range} />)
}

afterEach(cleanup)

describe('WeeklySummary(目標 5時間)', () => {
  it('合計・目標・消化率と、週の期間を表示する', () => {
    renderSummary(180)

    expect(screen.getByText('3時間')).toBeTruthy()
    expect(screen.getByText('/ 5時間', { exact: false })).toBeTruthy()
    expect(screen.getByText('(60%)')).toBeTruthy()
    expect(screen.getByText('2026/10/05(月)〜2026/10/11(日)')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('60')
  })

  it('目標に届くまでは、残りを表示する', () => {
    renderSummary(250)

    expect(screen.queryByRole('status')).toBeNull()
    expect(screen.getByText('目標まで、あと50分')).toBeTruthy()
  })

  it('ちょうど目標に届いたら、達成を表示する', () => {
    renderSummary(300)

    expect(screen.getByRole('status').textContent).toBe('今週の目標を達成しました。')
  })

  it('目標を超えたら、達成と多く稼働した時間を表示し、バーは 100% で止める', () => {
    renderSummary(390)

    expect(screen.getByRole('status').textContent).toBe(
      '今週の目標を達成しました。目標より1時間30分多く稼働しています。',
    )
    expect(screen.getByText('(130%)')).toBeTruthy()
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100')
  })
})
