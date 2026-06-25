'use client'

import { useEffect, useRef, useState } from 'react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/components/AuthProvider'
import UserAvatar, { joinName, splitName } from '@/components/UserAvatar'
import { initialsForUser, updateProfile } from '@/lib/auth'

const SECTIONS = [
  { id: 'profile', label: 'Your profile' },
  { id: 'company', label: 'Company' },
] as const

function InputField({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
  placeholder,
}: {
  label: string
  value: string
  onChange?: (value: string) => void
  type?: string
  readOnly?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-[#4f5d73]">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        className={`w-full rounded-lg border border-[#d6deea] px-3 py-2 text-[13px] text-[#0f1b2d] transition-colors focus:border-[#0062ff] focus:outline-none focus:ring-2 focus:ring-[#0062ff]/10 ${
          readOnly ? 'bg-[#f4f6f9] text-[#7a8598]' : 'bg-white'
        }`}
      />
    </div>
  )
}

function SaveButton({ saved, onClick, disabled }: { saved: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 rounded-lg bg-[#0062ff] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#0050e6] disabled:opacity-60"
    >
      {saved ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Saved
        </>
      ) : (
        'Save changes'
      )}
    </button>
  )
}

export default function AccountPage() {
  const { user, loading, refresh } = useAuth()
  const [activeSection, setActiveSection] = useState<string>('profile')
  const [saved, setSaved] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [saving, setSaving] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return
    const { firstName: first, lastName: last } = splitName(user.name)
    setFirstName(first)
    setLastName(last)
    setCompany(user.company)
  }, [user])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        }
      },
      { root: container, rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    )

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSave = async (section: string, fields: { name?: string; company?: string }) => {
    setSaving(true)
    try {
      await updateProfile(fields)
      await refresh()
      setSaved(section)
      setTimeout(() => setSaved(null), 2000)
    } finally {
      setSaving(false)
    }
  }

  const resetProfile = () => {
    if (!user) return
    const { firstName: first, lastName: last } = splitName(user.name)
    setFirstName(first)
    setLastName(last)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center text-[13px] text-[#7a8598]">Loading…</div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex flex-1 items-center justify-center text-[13px] text-[#7a8598]">
          Sign in to manage your profile.
        </div>
      </AppLayout>
    )
  }

  const initials = initialsForUser(user)
  const displayName = user.name.trim() || user.email
  const companyLabel = user.company.trim() || 'Your workspace'

  return (
    <AppLayout>
      <div className="flex h-14 flex-shrink-0 items-center border-b border-[#d6deea] bg-white px-6">
        <h1 className="text-[15px] font-semibold text-[#0f1b2d]">Settings</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 flex-shrink-0 border-r border-[#d6deea] bg-white p-4">
          <div className="mb-4 rounded-xl border border-[#d6deea] bg-[#f4f6f9] p-3">
            <div className="flex items-center gap-2.5">
              <UserAvatar initials={initials} size="md" />
              <div className="min-w-0">
                <div className="truncate text-[12px] font-semibold text-[#0f1b2d]">{displayName}</div>
                <div className="truncate text-[10px] text-[#98a3b6]">{companyLabel}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-[#7a8598]">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-500" />
              Active
            </div>
          </div>

          <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-widest text-[#98a3b6]">
            On this page
          </p>
          <nav className="space-y-0.5">
            {SECTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-[12px] font-medium transition-colors ${
                  activeSection === id
                    ? 'bg-[#eef4ff] text-[#0062ff]'
                    : 'text-[#4f5d73] hover:bg-[#f4f6f9] hover:text-[#0f1b2d]'
                }`}
              >
                {activeSection === id && (
                  <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#0062ff]" />
                )}
                {label}
              </button>
            ))}
          </nav>
        </aside>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-xl space-y-10 px-8 py-8">
            <section id="profile" className="scroll-mt-4">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-[#0f1b2d]">Your profile</h2>
                <p className="mt-0.5 text-[12px] text-[#7a8598]">Your personal details and contact info.</p>
              </div>
              <div className="rounded-xl border border-[#d6deea] bg-white p-6">
                <div className="mb-6 flex items-center gap-4">
                  <UserAvatar initials={initials} size="lg" showEdit />
                  <div>
                    <div className="text-[14px] font-semibold text-[#0f1b2d]">{displayName}</div>
                    <div className="mt-0.5 text-[12px] text-[#7a8598]">{user.email}</div>
                    {user.company.trim() ? (
                      <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-semibold text-[#0062ff]">
                        {user.company}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InputField label="First name" value={firstName} onChange={setFirstName} />
                    <InputField label="Last name" value={lastName} onChange={setLastName} />
                  </div>
                  <InputField label="Work email" value={user.email} readOnly type="email" />
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-[#f0f3f7] pt-5">
                  <SaveButton
                    saved={saved === 'profile'}
                    disabled={saving}
                    onClick={() => void handleSave('profile', { name: joinName(firstName, lastName) })}
                  />
                  <button
                    type="button"
                    onClick={resetProfile}
                    disabled={saving}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium text-[#7a8598] transition-colors hover:text-[#0f1b2d] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>

            <section id="company" className="scroll-mt-4 pb-16">
              <div className="mb-4">
                <h2 className="text-[15px] font-semibold text-[#0f1b2d]">Company</h2>
                <p className="mt-0.5 text-[12px] text-[#7a8598]">Shared across your team workspace.</p>
              </div>
              <div className="rounded-xl border border-[#d6deea] bg-white p-6">
                <div className="space-y-4">
                  <InputField
                    label="Company name"
                    value={company}
                    onChange={setCompany}
                    placeholder="Your company"
                  />
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-[#f0f3f7] pt-5">
                  <SaveButton
                    saved={saved === 'company'}
                    disabled={saving}
                    onClick={() => void handleSave('company', { company })}
                  />
                  <button
                    type="button"
                    onClick={() => setCompany(user.company)}
                    disabled={saving}
                    className="rounded-lg px-4 py-2 text-[13px] font-medium text-[#7a8598] transition-colors hover:text-[#0f1b2d] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
