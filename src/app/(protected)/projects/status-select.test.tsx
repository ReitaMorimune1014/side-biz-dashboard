import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { moveProjectAction } from './actions'
import { StatusSelect } from './status-select'

vi.mock('./actions', () => ({ moveProjectAction: vi.fn() }))

const PROJECT_ID = '11111111-1111-4111-8111-111111111111'
const UNSAVED = '未保存の変更があります'

function renderSelect() {
  render(<StatusSelect projectId={PROJECT_ID} title="LP制作" from="in_progress" />)
  return screen.getByLabelText('「LP制作」の状態')
}

beforeEach(() => {
  vi.mocked(moveProjectAction).mockReset()
})

afterEach(cleanup)

describe('StatusSelect', () => {
  it('7つの状態をすべて選べて、最初は今の状態が選ばれている', () => {
    const select = renderSelect()

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      '見積',
      '受注',
      '進行',
      '納品',
      '請求済',
      '入金済',
      '失注',
    ])
    expect(select).toHaveProperty('value', 'in_progress')
    expect(screen.queryByText(/今の状態/)).toBeNull()
  })

  it('今と違う状態を選ぶと印が付き、今の状態に戻すと消える', () => {
    const select = renderSelect()
    expect(screen.queryByText(UNSAVED)).toBeNull()

    fireEvent.change(select, { target: { value: 'estimate' } })
    expect(screen.getByText(UNSAVED)).toBeTruthy()

    fireEvent.change(select, { target: { value: 'in_progress' } })
    expect(screen.queryByText(UNSAVED)).toBeNull()
  })

  it('選んだだけでは送らず、「変更」で今の状態と選んだ状態を送る', async () => {
    vi.mocked(moveProjectAction).mockResolvedValue({ status: 'idle' })
    const select = renderSelect()

    fireEvent.change(select, { target: { value: 'estimate' } })
    expect(moveProjectAction).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: '変更' }))
    await screen.findByRole('button', { name: '変更' })

    expect(moveProjectAction).toHaveBeenCalledWith(PROJECT_ID, 'in_progress', 'estimate')
  })

  it('変更に失敗したら、印を残してエラーを表示する', async () => {
    vi.mocked(moveProjectAction).mockResolvedValue({
      status: 'error',
      message: 'ほかの画面で状態が変わりました',
    })
    const select = renderSelect()

    fireEvent.change(select, { target: { value: 'paid' } })
    fireEvent.click(screen.getByRole('button', { name: '変更' }))

    expect((await screen.findByRole('alert')).textContent).toBe('ほかの画面で状態が変わりました')
    expect(screen.getByText(UNSAVED)).toBeTruthy()
  })
})
