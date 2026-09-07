'use client'

import { useEffect, type ReactNode } from 'react'
import { User, Users, X } from 'lucide-react'
import { appSheet } from '@/components/app/chrome'
import ProfilePane from './ProfilePane'
import TeamPane from './TeamPane'
import type { SettingsPane } from './SettingsContext'

export default function SettingsModal({
  open,
  pane,
  onPaneChange,
  onClose,
}: {
  open: boolean
  pane: SettingsPane
  onPaneChange: (pane: SettingsPane) => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-mk-ink/45 px-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`flex h-[min(40rem,86vh)] w-full max-w-3xl ${appSheet}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
      >
        <aside className="flex w-[11.5rem] shrink-0 flex-col bg-mk-raised py-4">
          <p className="mb-3 px-4 text-[12px] font-medium text-mk-ink-subtle">Settings</p>
          <nav className="flex flex-col gap-0.5 px-2" aria-label="Settings">
            <PaneButton
              active={pane === 'profile'}
              icon={<User className="h-3.5 w-3.5" />}
              label="Profile"
              onClick={() => onPaneChange('profile')}
            />
            <PaneButton
              active={pane === 'team'}
              icon={<Users className="h-3.5 w-3.5" />}
              label="Team"
              onClick={() => onPaneChange('team')}
            />
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
            <h2 id="settings-title" className="mk-app-heading text-mk-ink">
              {pane === 'profile' ? 'Profile' : 'Team'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[8px] p-1.5 text-mk-ink-subtle transition-colors hover:bg-mk-raised hover:text-mk-ink"
              aria-label="Close settings"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
            {pane === 'profile' ? <ProfilePane /> : <TeamPane />}
          </div>
        </div>
      </div>
    </div>
  )
}

function PaneButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
        active ? 'bg-mk-canvas text-mk-ink' : 'text-mk-ink-muted hover:bg-mk-canvas/70 hover:text-mk-ink'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
