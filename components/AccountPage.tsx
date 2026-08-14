'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, updateProfile } from '@/lib/auth'
import { listBoms } from '@/lib/api'

const PLAN_BOM_LIMIT = 20

function InputField({
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
      <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
        {label}
      </label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={`w-full border px-3 py-2 text-[13px] transition-colors focus:border-[#0062ff] focus:outline-none ${
          readOnly
            ? 'cursor-default border-slate-200 bg-[#f4f6f9] text-slate-400'
            : 'border-slate-200 bg-white text-slate-900'
        }`}
      />
    </div>
  )
}

export default function AccountPage() {
  const { user, refresh } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [bomCount, setBomCount] = useState(0)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }, [user])

  useEffect(() => {
    listBoms()
      .then((page) => setBomCount(page.items.length))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateProfile({ firstName, lastName, company })
      await refresh()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }

  if (!user) return null

  const initials = initialsForUser(user)
  const displayName = displayNameForUser(user)
  const bomPct = Math.min((bomCount / PLAN_BOM_LIMIT) * 100, 100)

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[960px] px-6 py-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">Account</p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">Settings</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500">
            Profile, plan usage, and team access for this workspace.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[960px] space-y-6 px-6 py-8">
        <section className="border border-slate-200 bg-white">
          <div className="flex items-center gap-4 border-b border-slate-200 px-5 py-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#0062ff] text-[15px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-semibold text-slate-900">
                {displayName || user.email}
              </p>
              <p className="truncate font-mono text-[12px] text-slate-400">{user.email}</p>
              <p className="mt-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0062ff]">
                Growth
                {user.company?.trim() ? ` · ${user.company}` : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-4 border-b border-slate-200 px-5 py-5 sm:grid-cols-2">
            <InputField label="First name" value={firstName} onChange={setFirstName} />
            <InputField label="Last name" value={lastName} onChange={setLastName} />
            <InputField label="Work email" value={user.email} readOnly type="email" />
            <InputField
              label="Company"
              value={company}
              onChange={setCompany}
              placeholder="Your company"
            />
          </div>

          <div className="flex items-center justify-end gap-2 bg-[#f4f6f9] px-5 py-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 transition-colors hover:border-slate-400 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {saved ? 'Saved' : saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <header className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Plan & usage</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Up to {PLAN_BOM_LIMIT} active BOMs on Growth.</p>
          </header>
          <div className="px-5 py-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                BOMs used
              </span>
              <span className="font-mono text-[13px] tabular-nums text-slate-800">
                {bomCount} / {PLAN_BOM_LIMIT}
              </span>
            </div>
            <div className="mb-2 h-1.5 overflow-hidden bg-slate-100">
              <div className="h-full bg-[#0062ff]" style={{ width: `${bomPct}%` }} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[13px] text-slate-500">
                {PLAN_BOM_LIMIT - bomCount} remaining on this plan
              </p>
              <button
                type="button"
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-[#0062ff] hover:underline"
              >
                Upgrade to Scale
              </button>
            </div>
          </div>
        </section>

        <section className="border border-slate-200 bg-white">
          <header className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Team</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">Invite teammates to this workspace.</p>
          </header>
          <div className="border-b border-slate-200 px-5 py-5">
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 border border-slate-200 px-3 py-2 text-[13px] text-slate-900 placeholder:text-slate-400 focus:border-[#0062ff] focus:outline-none"
              />
              <button
                type="button"
                disabled={!inviteEmail.includes('@')}
                className="shrink-0 bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
              >
                Invite
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#0062ff] text-[11px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-slate-900">
                {displayName || user.email}
              </p>
              <p className="truncate font-mono text-[11px] text-slate-400">{user.email}</p>
            </div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
              Admin
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
