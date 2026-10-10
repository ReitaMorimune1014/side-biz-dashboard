import { describe, expect, it } from 'vitest'
import { formatMinutes, splitMinutes } from './duration'

describe('formatMinutes', () => {
  it.each([
    [1, '1分'],
    [45, '45分'],
    [60, '1時間'],
    [90, '1時間30分'],
    [125, '2時間5分'],
    [1440, '24時間'],
  ])('%i 分は「%s」', (minutes, expected) => {
    expect(formatMinutes(minutes)).toBe(expected)
  })
})

describe('splitMinutes', () => {
  it.each([
    [0, 0, 0],
    [59, 0, 59],
    [60, 1, 0],
    [90, 1, 30],
    [1440, 24, 0],
  ])('%i 分は %i 時間 %i 分', (total, hours, minutes) => {
    expect(splitMinutes(total)).toEqual({ hours, minutes })
  })
})
