'use client'

import { useEffect, useState } from 'react'
import { appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'
import { useTeam } from '@/hooks/use-team'
import {
  disconnectGoogleSheets,
  getGoogleSheetsStatus,
  startGoogleSheets,
  type GoogleSheetsStatus,
} from '@/lib/api'
import { GOOGLE_OAUTH_FLAG_KEY, googleOauthNotice, googleOauthNoticeClass } from './helpers'

export default function IntegrationsPane() {
  const { team, canManage } = useTeam()
  const accountId = team?.account_id
  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null)
  const [oauthFlag, setOauthFlag] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const flag = sessionStorage.getItem(GOOGLE_OAUTH_FLAG_KEY)
    if (flag) {
      sessionStorage.removeItem(GOOGLE_OAUTH_FLAG_KEY)
      setOauthFlag(flag)
      setNotice(googleOauthNotice(flag))
    }
  }, [])

  useEffect(() => {
    if (!accountId) return
    let cancelled = false
    getGoogleSheetsStatus(accountId)
      .then((next) => {
        if (!cancelled) setStatus(next)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load Google Sheets')
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  if (!accountId) {
    return <p className="text-[13px] text-mk-ink-muted">Sign in to manage integrations.</p>
  }

  const connected = Boolean(status?.connected)
  const revoked = status?.status === 'revoked'

  const handleConnect = async () => {
    setBusy(true)
    setError(null)
    try {
      const { url } = await startGoogleSheets(accountId)
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Google Sheets')
      setBusy(false)
    }
  }

  const handleDisconnect = async () => {
    setBusy(true)
    setError(null)
    try {
      await disconnectGoogleSheets(accountId)
      setStatus({ connected: false, configured: status?.configured ?? true })
      setNotice('Google Sheets was disconnected.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disconnect Google Sheets')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-mk-ink-muted">
        One Google grant for the whole Prokuro account. Anyone who can upload a BOM can then open a
        spreadsheet this connecting admin can see.
      </p>

      {notice ? <p className={`text-[13px] ${googleOauthNoticeClass(oauthFlag)}`}>{notice}</p> : null}
      {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}

      {status && status.configured === false ? (
        <p className="text-[13px] text-mk-ink-muted">Google Sheets is not configured on this server.</p>
      ) : (
        <div className="rounded-[8px] bg-mk-raised px-4 py-4">
          <p className="text-[14px] font-medium text-mk-ink">Google Sheets</p>
          <p className="mt-1 text-[13px] text-mk-ink-muted">
            {connected
              ? `Connected${status?.connected_by_email ? ` by ${status.connected_by_email}` : ''}.`
              : revoked
                ? 'Google access was revoked. Connect again to restore the account grant.'
                : 'Not connected.'}
          </p>
          {canManage ? (
            <div className="mt-3">
              {connected ? (
                <button type="button" onClick={() => void handleDisconnect()} disabled={busy} className={appGhostBtn}>
                  Disconnect
                </button>
              ) : (
                <button type="button" onClick={() => void handleConnect()} disabled={busy} className={appPrimaryBtn}>
                  Connect Google
                </button>
              )}
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-mk-ink-muted">Only an owner or admin can connect or disconnect.</p>
          )}
        </div>
      )}
    </div>
  )
}
