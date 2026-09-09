import { describe, expect, it } from 'vitest'

import { settingsPaneFromQuery } from './SettingsContext'

describe('settingsPaneFromQuery', () => {
  it('maps known panes and treats access as plan', () => {
    expect(settingsPaneFromQuery('profile')).toBe('profile')
    expect(settingsPaneFromQuery('team')).toBe('team')
    expect(settingsPaneFromQuery('plan')).toBe('plan')
    expect(settingsPaneFromQuery('billing')).toBe('billing')
    expect(settingsPaneFromQuery('access')).toBe('plan')
  })

  it('falls back to profile', () => {
    expect(settingsPaneFromQuery(null)).toBe('profile')
    expect(settingsPaneFromQuery('unknown')).toBe('profile')
  })
})
