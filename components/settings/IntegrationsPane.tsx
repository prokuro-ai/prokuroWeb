'use client'

import { useEffect, useState } from 'react'
import { appField, appGhostBtn, appPrimaryBtn } from '@/components/app/chrome'
import { useTeam } from '@/hooks/use-team'
import {
  deleteErpMapping,
  disconnectGoogleSheets,
  getErpPrefs,
  getGoogleSheetsStatus,
  patchErpPrefs,
  requestErpLiveSync,
  startGoogleSheets,
  type GoogleSheetsStatus,
} from '@/lib/api'
import {
  EMPTY_ERP_PREFS,
  ERP_PRESETS,
  erpLabel,
  type ErpId,
  type ErpPrefs,
} from '@/lib/erp'
import { GOOGLE_OAUTH_FLAG_KEY, googleOauthNotice, googleOauthNoticeClass } from './helpers'

export default function IntegrationsPane() {
  const { team, canManage } = useTeam()
  const accountId = team?.account_id
  const [status, setStatus] = useState<GoogleSheetsStatus | null>(null)
  const [oauthFlag, setOauthFlag] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [erpPrefs, setErpPrefs] = useState<ErpPrefs | null>(null)
  const [erpLoading, setErpLoading] = useState(false)
  const [erpBusy, setErpBusy] = useState<string | null>(null)
  const [liveSyncNotice, setLiveSyncNotice] = useState<string | null>(null)

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

  useEffect(() => {
    if (!accountId) return
    let cancelled = false
    setErpLoading(true)
    getErpPrefs(accountId)
      .then((prefs) => {
        if (!cancelled) setErpPrefs(prefs)
      })
      .catch((err) => {
        if (!cancelled) {
          setErpPrefs(EMPTY_ERP_PREFS)
          setError(err instanceof Error ? err.message : 'Could not load ERP settings')
        }
      })
      .finally(() => {
        if (!cancelled) setErpLoading(false)
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
  const unconfigured = status?.configured === false

  const statusLine = !status
    ? 'Checking…'
    : unconfigured
      ? 'Not available on this server.'
      : connected
        ? status.connected_by_email
          ? `Connected by ${status.connected_by_email}`
          : 'Connected'
        : revoked
          ? 'Access was revoked. Connect again.'
          : 'Not connected'

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

  const setDefaultErp = async (erp: ErpId) => {
    setErpBusy('default')
    setError(null)
    try {
      const next = await patchErpPrefs(accountId, { default_erp: erp })
      setErpPrefs(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update default ERP')
    } finally {
      setErpBusy(null)
    }
  }

  const requestLive = async (erp: ErpId) => {
    setErpBusy(`live-${erp}`)
    setLiveSyncNotice(null)
    setError(null)
    try {
      const result = await requestErpLiveSync(accountId, erp)
      const next = await getErpPrefs(accountId)
      setErpPrefs(next)
      setLiveSyncNotice(result.message || "We'll reach out.")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not record interest')
    } finally {
      setErpBusy(null)
    }
  }

  const removeMapping = async (erp: string) => {
    setErpBusy(`map-${erp}`)
    setError(null)
    try {
      await deleteErpMapping(accountId, erp)
      const next = await getErpPrefs(accountId)
      setErpPrefs(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete mapping')
    } finally {
      setErpBusy(null)
    }
  }

  const requested = new Set((erpPrefs?.live_sync_requests ?? []).map((item) => item.erp))

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <h3 className="text-[14px] font-medium text-mk-ink">ERP file import</h3>
          <p className="mt-1 text-[13px] text-mk-ink-muted">
            Bring BOMs out of your ERP as CSV or Excel. Live sync is not available yet; you can request it
            below.
          </p>
        </div>

        {liveSyncNotice ? <p className="text-[13px] text-mk-green">{liveSyncNotice}</p> : null}
        {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}

        {erpLoading || !erpPrefs ? (
          <p className="text-[13px] text-mk-ink-muted">Loading ERP settings…</p>
        ) : (
          <>
            <label className="block max-w-sm">
              <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">Default ERP</span>
              <select
                value={erpPrefs.default_erp ?? 'other'}
                disabled={!canManage || erpBusy === 'default'}
                onChange={(e) => void setDefaultErp(e.target.value as ErpId)}
                className={appField}
              >
                {ERP_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-2">
              {ERP_PRESETS.filter((preset) => preset.id !== 'other').map((preset) => {
                const asked = requested.has(preset.id)
                return (
                  <div
                    key={preset.id}
                    className="flex flex-wrap items-center gap-3 rounded-[8px] bg-mk-raised px-4 py-3"
                  >
                    <div className="min-w-0 flex-1 basis-[12rem]">
                      <p className="text-[13px] font-medium text-mk-ink">{preset.label}</p>
                      <p className="text-[11px] text-mk-ink-subtle">File import ready</p>
                    </div>
                    {canManage ? (
                      asked ? (
                        <p className="text-[12px] text-mk-ink-muted">We&apos;ll reach out.</p>
                      ) : (
                        <button
                          type="button"
                          disabled={erpBusy === `live-${preset.id}`}
                          onClick={() => void requestLive(preset.id)}
                          className={appGhostBtn}
                        >
                          {erpBusy === `live-${preset.id}` ? 'Saving…' : 'Request live sync'}
                        </button>
                      )
                    ) : (
                      <p className="text-[12px] text-mk-ink-subtle">Owner or admin only</p>
                    )}
                  </div>
                )
              })}
            </div>

            <div>
              <h4 className="mb-2 text-[13px] font-medium text-mk-ink">Saved column mappings</h4>
              <p className="mb-2 text-[12px] text-mk-ink-subtle">
                Edit a mapping by importing again and checking &quot;Save this mapping&quot; on the column step.
              </p>
              {erpPrefs.mappings.length === 0 ? (
                <p className="text-[13px] text-mk-ink-muted">
                  No saved mappings yet. After an ERP import you can save the mapping for next time.
                </p>
              ) : (
                <ul className="divide-y divide-mk-line rounded-[8px] bg-mk-raised px-4">
                  {erpPrefs.mappings.map((mapping) => {
                    const pairs = Object.entries(mapping.column_mapping)
                      .slice(0, 4)
                      .map(([header, field]) => `${header} → ${field}`)
                      .join(' · ')
                    return (
                      <li key={mapping.erp} className="flex flex-wrap items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-mk-ink">{erpLabel(mapping.erp)}</p>
                          <p className="truncate text-[12px] text-mk-ink-subtle">{pairs || 'Custom mapping'}</p>
                        </div>
                        {canManage ? (
                          <button
                            type="button"
                            disabled={erpBusy === `map-${mapping.erp}`}
                            onClick={() => void removeMapping(mapping.erp)}
                            className="text-[12px] text-mk-ink-subtle hover:text-mk-red"
                          >
                            Delete
                          </button>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </>
        )}
      </section>

      <section className="space-y-5">
        <div>
          <h3 className="text-[14px] font-medium text-mk-ink">Google Sheets</h3>
          <p className="mt-1 text-[13px] text-mk-ink-muted">
            One Google connection for the account. Anyone who can upload a BOM can then open a spreadsheet
            that connection can see.
          </p>
        </div>

        {notice ? <p className={`text-[13px] ${googleOauthNoticeClass(oauthFlag)}`}>{notice}</p> : null}

        <div className="flex flex-wrap items-center gap-3 rounded-[8px] bg-mk-raised px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-mk-ink text-[11px] font-semibold text-mk-canvas">
            G
          </div>
          <div className="min-w-0 flex-1 basis-[12rem]">
            <p className="text-[13px] font-medium text-mk-ink">Google Sheets</p>
            <p className="truncate text-[11px] text-mk-ink-subtle">{statusLine}</p>
          </div>
          {canManage && status && !unconfigured ? (
            connected ? (
              <button type="button" onClick={() => void handleDisconnect()} disabled={busy} className={appGhostBtn}>
                {busy ? 'Working…' : 'Disconnect'}
              </button>
            ) : (
              <button type="button" onClick={() => void handleConnect()} disabled={busy} className={appPrimaryBtn}>
                {busy ? 'Opening…' : 'Connect'}
              </button>
            )
          ) : !canManage ? (
            <p className="text-[12px] text-mk-ink-subtle">Owner or admin only</p>
          ) : null}
        </div>
      </section>
    </div>
  )
}
