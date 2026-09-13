'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import PageHeader from '@/components/app/PageHeader'
import {
  appField,
  appGhostBtn,
  appPage,
  appPrimaryBtn,
  appSection,
  appSheet,
} from '@/components/app/chrome'
import {
  createAccessGrant,
  listAccessGrants,
  revokeAccessGrant,
  type AccessGrantItem,
} from '@/lib/api'

function expiryToRfc3339(value: string): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00Z`
  return trimmed
}

function formatExpiry(iso?: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString()
}

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [items, setItems] = useState<AccessGrantItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [rowBusy, setRowBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const next = await listAccessGrants()
    setItems(next)
    setLoaded(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    listAccessGrants()
      .then((next) => {
        if (!cancelled) setItems(next)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load access')
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const waiting = useMemo(() => items.filter((row) => row.status === 'waiting'), [items])
  const enabled = useMemo(() => items.filter((row) => row.status === 'enabled'), [items])

  async function enable(target: string, fromForm: boolean) {
    const key = target.trim().toLowerCase()
    if (fromForm) {
      setBusy(true)
    } else {
      setRowBusy(key)
    }
    setError(null)
    setNotice(null)
    try {
      const result = await createAccessGrant(
        target,
        fromForm ? expiryToRfc3339(expiresAt) : undefined,
      )
      setNotice(`Enabled ${result.email}. They will get an email if mail is configured.`)
      if (fromForm) {
        setEmail('')
        setExpiresAt('')
      }
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable access')
    } finally {
      setBusy(false)
      setRowBusy(null)
    }
  }

  async function revoke(target: string, fromForm: boolean) {
    const key = target.trim().toLowerCase()
    if (fromForm) {
      setBusy(true)
    } else {
      setRowBusy(key)
    }
    setError(null)
    setNotice(null)
    try {
      await revokeAccessGrant(target)
      setNotice(`Revoked ${key}.`)
      if (fromForm) setEmail('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke access')
    } finally {
      setBusy(false)
      setRowBusy(null)
    }
  }

  return (
    <div className={appPage}>
      <PageHeader
        title="Admin"
        description="Waiting registrations and enabled accounts. Enable after the contract."
      />
      <div className={appSection}>
        <div className={`${appSheet} max-w-3xl px-5 py-5`}>
          {notice ? <p className="mb-4 text-[13px] text-mk-accent">{notice}</p> : null}
          {error ? <p className="mb-4 text-[13px] text-mk-red">{error}</p> : null}

          {!loaded ? (
            <p className="text-[13px] text-mk-ink-muted">Loading access…</p>
          ) : items.length === 0 ? (
            <p className="text-[13px] text-mk-ink-muted">No registrations yet.</p>
          ) : (
            <div className="divide-y divide-mk-line overflow-hidden rounded-[8px] bg-mk-raised">
              {waiting.length > 0 ? (
                <div className="px-4 py-2">
                  <span className="mk-eyebrow">Waiting</span>
                </div>
              ) : null}
              {waiting.map((row) => (
                <AccessRow
                  key={`waiting-${row.email}`}
                  row={row}
                  busy={rowBusy === row.email || busy}
                  onEnable={() => void enable(row.email, false)}
                  onRevoke={() => void revoke(row.email, false)}
                />
              ))}
              {enabled.length > 0 ? (
                <div className="px-4 py-2">
                  <span className="mk-eyebrow">Enabled</span>
                </div>
              ) : null}
              {enabled.map((row) => (
                <AccessRow
                  key={`enabled-${row.email}`}
                  row={row}
                  busy={rowBusy === row.email || busy}
                  onEnable={() => void enable(row.email, false)}
                  onRevoke={() => void revoke(row.email, false)}
                />
              ))}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-[13px] font-medium text-mk-ink">Enable by email</p>
              <p className="mt-1 text-[12px] text-mk-ink-muted">
                Use this if they are not in the list yet.
              </p>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">Customer email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={appField}
                placeholder="buyer@company.com"
              />
            </label>
            <label className="block max-w-xs">
              <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">
                Access ends (optional)
              </span>
              <input
                type="date"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className={appField}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !email.trim()}
                onClick={() => void enable(email, true)}
                className={appPrimaryBtn}
              >
                {busy ? 'Working…' : 'Enable'}
              </button>
              <button
                type="button"
                disabled={busy || !email.trim()}
                onClick={() => void revoke(email, true)}
                className={appGhostBtn}
              >
                Revoke
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccessRow({
  row,
  busy,
  onEnable,
  onRevoke,
}: {
  row: AccessGrantItem
  busy: boolean
  onEnable: () => void
  onRevoke: () => void
}) {
  const waiting = row.status === 'waiting'
  const until = formatExpiry(row.expires_at)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[10px] font-bold ${
          waiting ? 'bg-mk-amber/15 text-mk-amber' : 'bg-mk-ink text-mk-canvas'
        }`}
      >
        {waiting ? '…' : '✓'}
      </div>
      <div className="min-w-0 flex-1 basis-[12rem]">
        <p className="truncate text-[13px] font-medium text-mk-ink">{row.email}</p>
        <p className="truncate text-[11px] text-mk-ink-subtle">
          {waiting ? 'Waiting for access' : until ? `Enabled · ends ${until}` : 'Enabled'}
        </p>
      </div>
      {waiting ? (
        <button
          type="button"
          disabled={busy}
          onClick={onEnable}
          className="shrink-0 text-[13px] font-medium text-mk-accent hover:text-mk-accent-hover disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Enable'}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={onRevoke}
          className="shrink-0 text-[13px] font-medium text-mk-ink-subtle hover:text-mk-red disabled:opacity-50"
        >
          {busy ? 'Working…' : 'Revoke'}
        </button>
      )}
    </div>
  )
}
