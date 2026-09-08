'use client'

import { useState } from 'react'
import PageHeader from '@/components/app/PageHeader'
import { appGhostBtn, appPage, appPrimaryBtn, appSection, appSheet } from '@/components/app/chrome'
import { createAccessGrant, revokeAccessGrant } from '@/lib/api'

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enable() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      const result = await createAccessGrant(email, expiresAt.trim() ? expiresAt.trim() : undefined)
      setNotice(`Enabled ${result.email}. They will get an email if mail is configured.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable access')
    } finally {
      setBusy(false)
    }
  }

  async function revoke() {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await revokeAccessGrant(email)
      setNotice(`Revoked ${email.trim().toLowerCase()}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke access')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={appPage}>
      <PageHeader
        title="Admin"
        description="Enable a customer after the contract. Size BOMs and seats on the paper, not in this form."
      />
      <div className={appSection}>
        <div className={`${appSheet} max-w-xl px-5 py-5`}>
          {notice ? <p className="mb-4 text-[13px] text-mk-accent">{notice}</p> : null}
          {error ? <p className="mb-4 text-[13px] text-mk-red">{error}</p> : null}
          <label className="block">
            <span className="mk-eyebrow">Customer email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full border-0 border-b border-mk-line bg-transparent py-2 text-[14px] text-mk-ink focus:border-mk-accent focus:outline-none"
              placeholder="buyer@company.com"
            />
          </label>
          <label className="mt-5 block">
            <span className="mk-eyebrow">Access ends (optional RFC3339 or leave blank)</span>
            <input
              type="text"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              className="mt-1.5 w-full border-0 border-b border-mk-line bg-transparent py-2 text-[14px] text-mk-ink focus:border-mk-accent focus:outline-none"
              placeholder="2027-03-01T00:00:00Z"
            />
          </label>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" disabled={busy || !email.trim()} onClick={() => void enable()} className={appPrimaryBtn}>
              {busy ? 'Working…' : 'Enable'}
            </button>
            <button type="button" disabled={busy || !email.trim()} onClick={() => void revoke()} className={appGhostBtn}>
              Revoke
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
