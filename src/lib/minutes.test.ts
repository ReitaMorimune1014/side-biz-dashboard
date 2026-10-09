import { describe, expect, it } from 'vitest'
import { formatMinutes } from './minutes'

describe('formatMinutes', () => {
  it('60分未満は分だけで表示する', () => {
    expect(formatMinutes(45)).toBe('45分')
  })
  it('0分は「0分」と表示する', () => {
    expect(formatMinutes(0)).toBe('0分')
  })
  it('ちょうどの時間は時間だけで表示する', () => {
    expect(formatMinutes(120)).toBe('2時間')
  })
  it('時間と分を併記する', () => {
    expect(formatMinutes(90)).toBe('1時間30分')
  })
  it('負数と小数は拒否する', () => {
    expect(() => formatMinutes(-1)).toThrow(RangeError)
    expect(() => formatMinutes(1.5)).toThrow(RangeError)
  })
})
