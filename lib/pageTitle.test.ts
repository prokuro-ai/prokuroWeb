import { describe, expect, it } from 'vitest'

import { formatPageTitle, PAGE, pageTitleForPath } from '@/lib/pageTitle'

describe('formatPageTitle', () => {
  it('uses the shared suffix', () => {
    expect(formatPageTitle(PAGE.boms)).toBe('BOMs | Prokuro AI')
  })
})

describe('pageTitleForPath', () => {
  it('maps product routes', () => {
    expect(pageTitleForPath('/dashboard')).toBe(PAGE.thisWeek)
    expect(pageTitleForPath('/boms/')).toBe(PAGE.boms)
    expect(pageTitleForPath('/bom/abc')).toBe(PAGE.bom)
    expect(pageTitleForPath('/purchasing')).toBe(PAGE.buy)
    expect(pageTitleForPath('/admin')).toBe(PAGE.admin)
  })

  it('maps marketing and auth routes', () => {
    expect(pageTitleForPath('/login')).toBe(PAGE.login)
    expect(pageTitleForPath('/schedule')).toBe(PAGE.schedule)
    expect(pageTitleForPath('/invite/accept')).toBe(PAGE.invite)
    expect(pageTitleForPath('/')).toBeNull()
  })
})
