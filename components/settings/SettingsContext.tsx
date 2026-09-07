'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export type SettingsPane = 'profile' | 'team'

type SettingsContextValue = {
  open: boolean
  pane: SettingsPane
  openSettings: (pane?: SettingsPane) => void
  setPane: (pane: SettingsPane) => void
  closeSettings: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [pane, setPane] = useState<SettingsPane>('profile')

  const openSettings = useCallback((next: SettingsPane = 'profile') => {
    setPane(next)
    setOpen(true)
  }, [])

  const closeSettings = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ open, pane, openSettings, setPane, closeSettings }),
    [open, pane, openSettings, closeSettings],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const value = useContext(SettingsContext)
  if (!value) {
    throw new Error('useSettings must be used inside SettingsProvider')
  }
  return value
}
