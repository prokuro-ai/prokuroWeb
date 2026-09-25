import { describe, expect, it } from 'vitest'

import { settingsPaneFromQuery } from './SettingsContext'
import { googleOauthNotice, googleOauthNoticeClass } from './helpers'

describe('settingsPaneFromQuery', () => {
  it('maps known panes and treats access as plan', () => {
    expect(settingsPaneFromQuery('profile')).toBe('profile')
    expect(settingsPaneFromQuery('team')).toBe('team')
    expect(settingsPaneFromQuery('plan')).toBe('plan')
    expect(settingsPaneFromQuery('billing')).toBe('billing')
    expect(settingsPaneFromQuery('integrations')).toBe('integrations')
    expect(settingsPaneFromQuery('google')).toBe('integrations')
    expect(settingsPaneFromQuery('access')).toBe('plan')
  })

  it('falls back to profile', () => {
    expect(settingsPaneFromQuery(null)).toBe('profile')
    expect(settingsPaneFromQuery('unknown')).toBe('profile')
  })
})

describe('googleOauthNotice', () => {
  it('maps callback flags', () => {
    expect(googleOauthNotice('connected')).toMatch(/connected/i)
    expect(googleOauthNotice('denied')).toMatch(/denied/i)
    expect(googleOauthNotice('error')).toMatch(/could not connect/i)
    expect(googleOauthNotice(null)).toBeNull()
  })

  it('does not paint deny/error as success', () => {
    expect(googleOauthNoticeClass('connected')).toBe('text-mk-green')
    expect(googleOauthNoticeClass('denied')).toBe('text-mk-amber')
    expect(googleOauthNoticeClass('error')).toBe('text-mk-amber')
  })
})
