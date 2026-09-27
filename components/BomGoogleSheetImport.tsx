'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { appPrimaryBtn } from '@/components/app/chrome'
import { useSettings } from '@/components/settings/SettingsContext'
import {
  getGoogleSheetsStatus,
  GoogleSheetsRevokedError,
  importGoogleSheetTab,
  listGoogleSpreadsheets,
  listGoogleTabs,
  type GoogleSheetTab,
  type GoogleSpreadsheet,
} from '@/lib/api'

export default function BomGoogleSheetImport({
  accountId,
  canManage,
  disabled,
  onFile,
}: {
  accountId: string
  canManage: boolean
  disabled?: boolean
  onFile: (file: File) => void
}) {
  const { openSettings } = useSettings()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [spreadsheets, setSpreadsheets] = useState<GoogleSpreadsheet[]>([])
  const [tabs, setTabs] = useState<GoogleSheetTab[]>([])
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [tab, setTab] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    getGoogleSheetsStatus(accountId)
      .then(async (status) => {
        if (cancelled) return
        setConnected(Boolean(status.connected))
        if (status.status === 'revoked') {
          setError('Google access was revoked. Reconnect it in Settings.')
        }
        if (!status.connected) return
        const files = await listGoogleSpreadsheets(accountId)
        if (!cancelled) setSpreadsheets(files)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof GoogleSheetsRevokedError) {
          setConnected(false)
          setError('Google access was revoked. Reconnect it in Settings.')
          return
        }
        setConnected(false)
        setError(err instanceof Error ? err.message : 'Could not load Google Sheets')
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  useEffect(() => {
    if (!spreadsheetId) {
      setTabs([])
      setTab('')
      return
    }
    let cancelled = false
    listGoogleTabs(accountId, spreadsheetId)
      .then((next) => {
        if (cancelled) return
        setTabs(next)
        setTab(next[0]?.title ?? '')
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load tabs')
      })
    return () => {
      cancelled = true
    }
  }, [accountId, spreadsheetId])

  const sheet = useMemo(
    () => spreadsheets.find((item) => item.id === spreadsheetId) ?? null,
    [spreadsheets, spreadsheetId],
  )

  const handleImport = async () => {
    if (!spreadsheetId || !tab) return
    setBusy(true)
    setError(null)
    try {
      const imported = await importGoogleSheetTab(accountId, {
        spreadsheet_id: spreadsheetId,
        tab,
        name: sheet?.name,
      })
      onFile(new File([imported.csv], imported.filename, { type: 'text/csv' }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not import that sheet')
    } finally {
      setBusy(false)
    }
  }

  if (connected !== true) {
    return (
      <div className="rounded-[8px] bg-mk-raised px-4 py-4">
        {connected === null ? (
          <p className="flex items-center gap-2 text-[13px] text-mk-ink-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Checking Google Sheets…
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-mk-ink">Google Sheets is not connected</p>
              <p className="mt-1 text-[12px] text-mk-ink-muted">
                {error ??
                  (canManage
                    ? 'Connect once in Settings. Then anyone who can upload can open a spreadsheet.'
                    : 'Ask an owner or admin to connect it in Settings.')}
              </p>
            </div>
            {canManage ? (
              <button
                type="button"
                className={appPrimaryBtn}
                onClick={() => openSettings('integrations')}
              >
                Connect
              </button>
            ) : null}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}

      {spreadsheets.length === 0 ? (
        <p className="text-[13px] text-mk-ink-muted">No spreadsheets in that Google account.</p>
      ) : (
        <ul className="max-h-52 divide-y divide-mk-line overflow-y-auto rounded-[8px] bg-mk-raised">
          {spreadsheets.map((item) => {
            const on = item.id === spreadsheetId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  disabled={disabled || busy}
                  onClick={() => setSpreadsheetId(item.id)}
                  className={`flex w-full items-center px-4 py-3 text-left text-[13px] transition-colors disabled:opacity-50 ${
                    on ? 'bg-mk-canvas font-medium text-mk-ink' : 'text-mk-ink hover:bg-mk-canvas/70'
                  }`}
                >
                  <span className="truncate">{item.name || 'Untitled spreadsheet'}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {spreadsheetId ? (
        <div>
          <p className="mb-2 text-[12px] font-medium text-mk-ink-subtle">Tab</p>
          {tabs.length === 0 ? (
            <p className="text-[13px] text-mk-ink-muted">No tabs in that spreadsheet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tabs.map((item) => {
                const on = item.title === tab
                return (
                  <button
                    key={`${item.sheet_id}-${item.title}`}
                    type="button"
                    disabled={disabled || busy}
                    onClick={() => setTab(item.title)}
                    className={`rounded-[8px] px-3 py-1.5 text-[13px] transition-colors disabled:opacity-50 ${
                      on ? 'bg-mk-ink text-mk-canvas' : 'bg-mk-raised text-mk-ink hover:bg-mk-raised-2'
                    }`}
                  >
                    {item.title || 'Untitled'}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : null}

      <button
        type="button"
        className={appPrimaryBtn}
        disabled={disabled || busy || !spreadsheetId || !tab}
        onClick={() => void handleImport()}
      >
        {busy ? 'Adding…' : 'Add this sheet'}
      </button>
    </div>
  )
}
