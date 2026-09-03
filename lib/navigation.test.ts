import { describe, expect, it } from 'vitest'

import { safeNextPath } from '@/lib/navigation'

describe('safeNextPath', () => {
  it('keeps same-origin paths with their query and hash', () => {
    expect(safeNextPath('/boms/abc')).toBe('/boms/abc')
    expect(safeNextPath('/boms?tab=risk#top')).toBe('/boms?tab=risk#top')
  })

  it('falls back for off-site targets', () => {
    for (const hostile of [
      'https://evil.com',
      '//evil.com',
      '/\\evil.com',
      '/\\/evil.com',
      'javascript:alert(1)',
      '',
      null,
      undefined,
    ]) {
      expect(safeNextPath(hostile)).toBe('/dashboard')
    }
  })

  it('honours the caller-supplied fallback', () => {
    expect(safeNextPath('//evil.com', '/login')).toBe('/login')
  })
})
