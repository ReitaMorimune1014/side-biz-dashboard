import { describe, expect, it } from 'vitest'
import { isCurrentPath } from './nav'

describe('isCurrentPath', () => {
  it.each([
    ['/projects', '/projects', true],
    ['/projects/board', '/projects', true],
    ['/projects/abc/edit', '/projects', true],
    ['/projectsx', '/projects', false],
    ['/money', '/projects', false],
    ['/', '/dashboard', false],
  ])('%s は %s の中か → %s', (pathname, href, expected) => {
    expect(isCurrentPath(pathname, href)).toBe(expected)
  })
})
