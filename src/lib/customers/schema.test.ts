import { describe, expect, it } from 'vitest'
import { CUSTOMER_MEMO_MAX, CUSTOMER_NAME_MAX, isCustomerId, parseCustomerInput } from './schema'

describe('parseCustomerInput', () => {
  it('名前の前後の空白を除く', () => {
    expect(parseCustomerInput({ name: '  A社  ', memo: '' })).toEqual({
      success: true,
      data: { name: 'A社', memo: null },
    })
  })

  it('空白だけの名前は拒否する', () => {
    expect(parseCustomerInput({ name: '   ', memo: '' })).toEqual({
      success: false,
      fieldErrors: { name: '名前を入力してください' },
    })
  })

  it('名前がないときは拒否する', () => {
    const result = parseCustomerInput({ name: null, memo: null })
    expect(result.success).toBe(false)
  })

  it(`名前は${CUSTOMER_NAME_MAX}文字まで通す`, () => {
    const result = parseCustomerInput({ name: 'あ'.repeat(CUSTOMER_NAME_MAX), memo: '' })
    expect(result.success).toBe(true)
  })

  it(`名前が${CUSTOMER_NAME_MAX + 1}文字なら拒否する`, () => {
    const result = parseCustomerInput({ name: 'あ'.repeat(CUSTOMER_NAME_MAX + 1), memo: '' })
    expect(result).toEqual({
      success: false,
      fieldErrors: { name: `名前は${CUSTOMER_NAME_MAX}文字以内で入力してください` },
    })
  })

  it('メモはそのまま保存する(改行や前後の空白を残す)', () => {
    const result = parseCustomerInput({ name: 'A社', memo: ' 担当: 山田\n月末締め ' })
    expect(result).toEqual({ success: true, data: { name: 'A社', memo: ' 担当: 山田\n月末締め ' } })
  })

  it('空白だけのメモは null にする', () => {
    const result = parseCustomerInput({ name: 'A社', memo: ' \n ' })
    expect(result).toEqual({ success: true, data: { name: 'A社', memo: null } })
  })

  it(`メモは${CUSTOMER_MEMO_MAX}文字まで通し、それを超えたら拒否する`, () => {
    expect(parseCustomerInput({ name: 'A社', memo: 'a'.repeat(CUSTOMER_MEMO_MAX) }).success).toBe(
      true,
    )
    expect(parseCustomerInput({ name: 'A社', memo: 'a'.repeat(CUSTOMER_MEMO_MAX + 1) })).toEqual({
      success: false,
      fieldErrors: { memo: `メモは${CUSTOMER_MEMO_MAX}文字以内で入力してください` },
    })
  })

  it('名前とメモの両方のエラーを、項目ごとに返す', () => {
    const result = parseCustomerInput({ name: '', memo: 'a'.repeat(CUSTOMER_MEMO_MAX + 1) })
    expect(result).toEqual({
      success: false,
      fieldErrors: {
        name: '名前を入力してください',
        memo: `メモは${CUSTOMER_MEMO_MAX}文字以内で入力してください`,
      },
    })
  })
})

describe('isCustomerId', () => {
  it('UUID を通す', () => {
    expect(isCustomerId('3f1c2b7e-8a4d-4c1e-9b2f-1a2b3c4d5e6f')).toBe(true)
  })

  it.each(['', '1', 'not-a-uuid', '3f1c2b7e-8a4d-4c1e-9b2f-1a2b3c4d5e6'])('%s は拒否する', (id) => {
    expect(isCustomerId(id)).toBe(false)
  })
})
