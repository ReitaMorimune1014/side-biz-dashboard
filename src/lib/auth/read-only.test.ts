import { describe, expect, it } from 'vitest'
import { isReadOnly } from './read-only'

describe('isReadOnly', () => {
  it('read_only が true のときだけ、閲覧専用', () => {
    expect(isReadOnly({ read_only: true, provider: 'email' })).toBe(true)
  })

  it.each([
    ['フラグなし', { provider: 'email' }],
    ['false', { read_only: false }],
    ['文字列の "true"', { read_only: 'true' }],
    ['数値の 1', { read_only: 1 }],
    ['空', {}],
    ['null', null],
    ['undefined', undefined],
    ['配列', [true]],
  ])('%s なら、閲覧専用ではない', (_label, metadata) => {
    expect(isReadOnly(metadata)).toBe(false)
  })
})
