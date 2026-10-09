import { describe, expect, it } from 'vitest'
import { fieldErrorsOf, readFields } from './form-values'

describe('readFields', () => {
  it('決めた項目だけを文字列で取り出し、ない項目は空文字にする', () => {
    const formData = new FormData()
    formData.set('name', '山田')
    formData.set('extra', '使わない')

    expect(readFields(formData, ['name', 'memo'])).toEqual({ name: '山田', memo: '' })
  })

  it('ファイルは空文字にする', () => {
    const formData = new FormData()
    formData.set('name', new Blob(['x']))

    expect(readFields(formData, ['name'])).toEqual({ name: '' })
  })
})

describe('fieldErrorsOf', () => {
  it('成功なら空、失敗なら項目ごとのエラー', () => {
    expect(fieldErrorsOf({ success: true })).toEqual({})
    expect(fieldErrorsOf({ success: false, fieldErrors: { name: '名前を入力してください' } })).toEqual(
      { name: '名前を入力してください' },
    )
  })
})
