import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { InvoiceForm } from './invoice-form'

vi.mock('next/link', () => ({ default: (props: object) => <a {...props} /> }))

const projects = [
  { id: 'p1', label: 'LP制作(A社)', amount: 120000 },
  { id: 'p2', label: '保守(B社)', amount: 30000 },
]

function renderForm(prefillAmount: boolean) {
  render(
    <InvoiceForm
      action={vi.fn()}
      projects={projects}
      defaultValues={{}}
      submitLabel="作成する"
      prefillAmount={prefillAmount}
    />,
  )
  return {
    project: screen.getByLabelText(/案件/),
    amount: screen.getByLabelText(/金額/) as HTMLInputElement,
  }
}

afterEach(cleanup)

describe('InvoiceForm の金額の初期値', () => {
  it('案件を選ぶと、その案件の金額が入り、選び直すと入れ替わる', () => {
    const { project, amount } = renderForm(true)

    fireEvent.change(project, { target: { value: 'p1' } })
    expect(amount.value).toBe('120000')

    fireEvent.change(project, { target: { value: 'p2' } })
    expect(amount.value).toBe('30000')
  })

  it('自分で金額を入力した後は、案件を選んでも上書きしない', () => {
    const { project, amount } = renderForm(true)

    fireEvent.input(amount, { target: { value: '50000' } })
    fireEvent.change(project, { target: { value: 'p1' } })

    expect(amount.value).toBe('50000')
  })

  it('編集のとき(prefillAmount なし)は、案件を選び直しても金額を変えない', () => {
    const { project, amount } = renderForm(false)

    fireEvent.change(project, { target: { value: 'p1' } })
    expect(amount.value).toBe('')
  })
})
