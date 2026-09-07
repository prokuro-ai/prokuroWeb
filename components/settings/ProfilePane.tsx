'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { appField, appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'
import { displayNameForUser, initialsForUser, updateProfile } from '@/lib/auth'

function Field({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  readOnly?: boolean
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={`${appField} ${readOnly ? 'cursor-default bg-mk-raised text-mk-ink-subtle' : ''}`}
      />
    </div>
  )
}

export default function ProfilePane() {
  const { user, refresh } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }, [user])

  if (!user) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ firstName, lastName, company })
      await refresh()
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-[14px] font-semibold text-mk-canvas">
          {initialsForUser(user)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-mk-ink">
            {displayNameForUser(user) || user.email}
          </p>
          <p className="truncate text-[13px] text-mk-ink-muted">{user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="First name" value={firstName} onChange={setFirstName} />
        <Field label="Last name" value={lastName} onChange={setLastName} />
      </div>
      <Field label="Work email" value={user.email} readOnly type="email" />
      <Field label="Company" value={company} onChange={setCompany} placeholder="Your company" />

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={handleCancel} disabled={saving} className={appGhostBtn}>
          Cancel
        </button>
        <button type="button" onClick={() => void handleSave()} disabled={saving} className={appPrimaryBtn}>
          {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}
