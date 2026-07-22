'use client'

import { useEffect, useState } from 'react'
import { useLocation } from '@/lib/navigation'
import { useAuth } from '@/components/AuthProvider'
import { displayNameForUser, initialsForUser, updateProfile, signOut } from '@/lib/auth'
import { listBoms } from '@/lib/api'
import { ArrowLeft, LogOut } from 'lucide-react'

const BLUE = '#0062ff'
const NAVY = '#0f1b2d'
const PLAN_BOM_LIMIT = 20

function InputField({
  label, value, onChange, readOnly = false, placeholder, type = 'text',
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
      <label className="mb-1.5 block text-[12px] font-medium text-slate-400">{label}</label>
      <input
        type={type}
        readOnly={readOnly}
        value={value}
        onChange={onChange ? e => onChange(e.target.value) : undefined}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-[13px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20 focus:border-[#0062ff] ${
          readOnly
            ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default'
            : 'bg-white border-slate-200 text-[#0f1b2d]'
        }`}
      />
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</p>
  )
}

export default function AccountPage() {
  const { user, loading, refresh } = useAuth()
  const [, navigate] = useLocation()

  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [company,   setCompany]   = useState('')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)

  const [bomCount,  setBomCount]  = useState(0)
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

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleCancel = () => {
    if (!user) return
    setFirstName(user.firstName)
    setLastName(user.lastName)
    setCompany(user.company)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-[13px] text-slate-400">
        Loading…
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 font-sans text-[13px] text-slate-400">
        Sign in to manage your account.
      </div>
    )
  }

  const initials    = initialsForUser(user)
  const displayName = displayNameForUser(user)
  const bomPct      = Math.min((bomCount / PLAN_BOM_LIMIT) * 100, 100)

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-[#0f1b2d]">

      {/* Page header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-[13px] text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <span className="text-slate-200">/</span>
          <span className="text-[13px] font-semibold" style={{ color: NAVY }}>Account settings</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">

        {/* Identity banner */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-200">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
            style={{ background: BLUE }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[18px] font-semibold truncate" style={{ color: NAVY }}>{displayName || user.email}</p>
            <p className="text-[13px] text-slate-500 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {user.company?.trim() && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#0062ff]">
                  {user.company}
                </span>
              )}
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                Growth Plan
              </span>
            </div>
          </div>
        </div>

        {/* Profile + Company */}
        <div>
          <SectionLabel>Profile</SectionLabel>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="grid grid-cols-2 gap-3">
                <InputField label="First name" value={firstName} onChange={setFirstName} />
                <InputField label="Last name"  value={lastName}  onChange={setLastName}  />
              </div>
            </div>
            <div className="px-5 py-4 border-b border-slate-100">
              <InputField label="Work email" value={user.email} readOnly type="email" />
            </div>
            <div className="px-5 py-4 border-b border-slate-100">
              <InputField label="Company" value={company} onChange={setCompany} placeholder="Your company" />
            </div>
            <div className="px-5 py-3 bg-slate-50 flex items-center justify-end gap-2">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-[12px] font-medium text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
                style={{ background: BLUE }}
              >
                {saved ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Saved
                  </>
                ) : saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Plan & usage */}
        <div>
          <SectionLabel>Plan & usage</SectionLabel>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[14px] font-semibold" style={{ color: NAVY }}>Growth Plan</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">Up to {PLAN_BOM_LIMIT} active BOMs</p>
                </div>
                <button
                  className="shrink-0 ml-4 px-3.5 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors hover:bg-blue-50"
                  style={{ color: BLUE, borderColor: '#bfdbfe' }}
                >
                  Upgrade to Scale
                </button>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between text-[12px] mb-2">
                <span className="text-slate-500">BOMs used</span>
                <span className="font-semibold" style={{ color: NAVY }}>{bomCount} / {PLAN_BOM_LIMIT}</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${bomPct}%`, background: BLUE }}
                />
              </div>
              <p className="text-[11px] text-slate-400">{PLAN_BOM_LIMIT - bomCount} BOMs remaining on your plan</p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="pb-16">
          <SectionLabel>Team</SectionLabel>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-5 border-b border-slate-100">
              <p className="text-[13px] font-medium mb-3" style={{ color: NAVY }}>Invite teammates</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/20 focus:border-[#0062ff]"
                />
                <button
                  disabled={!inviteEmail.includes('@')}
                  className="shrink-0 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-colors disabled:opacity-40"
                  style={{ background: BLUE }}
                >
                  Invite
                </button>
              </div>
            </div>
            {/* Current members */}
            <div className="flex items-center gap-3 px-5 py-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ background: BLUE }}
              >
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate" style={{ color: NAVY }}>{displayName || user.email}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Admin</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
