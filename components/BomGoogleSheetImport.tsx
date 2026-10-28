'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import AppPicker from '@/components/app/AppPicker'
import { appField, appPrimaryBtn } from '@/components/app/chrome'
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
import { formatUploadedAt } from '@/lib/format'

function revokedMessage() {
  return 'Google access was revoked. Reconnect it in Settings.'
}

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
  const [listing, setListing] = useState(false)
  const [tabs, setTabs] = useState<GoogleSheetTab[]>([])
  const [tabsLoading, setTabsLoading] = useState(false)
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [tab, setTab] = useState('')
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setListing(true)
    getGoogleSheetsStatus(accountId)
      .then(async (status) => {
        if (cancelled) return
        setConnected(Boolean(status.connected))
        if (status.status === 'revoked') {
          setError(revokedMessage())
        }
        if (!status.connected) return
        const files = await listGoogleSpreadsheets(accountId)
        if (!cancelled) setSpreadsheets(files)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof GoogleSheetsRevokedError) {
          setConnected(false)
          setError(revokedMessage())
          return
        }
        setConnected(false)
        setError(err instanceof Error ? err.message : 'Could not load Google Sheets')
      })
      .finally(() => {
        if (!cancelled) setListing(false)
      })
    return () => {
      cancelled = true
    }
  }, [accountId])

  useEffect(() => {
    if (!spreadsheetId) {
      setTabs([])
      setTab('')
      setTabsLoading(false)
      return
    }
    let cancelled = false
    setTabsLoading(true)
    setTabs([])
    setTab('')
    listGoogleTabs(accountId, spreadsheetId)
      .then((next) => {
        if (cancelled) return
        setTabs(next)
        setTab(next[0]?.title ?? '')
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof GoogleSheetsRevokedError) {
          setConnected(false)
          setError(revokedMessage())
          return
        }
        setError(err instanceof Error ? err.message : 'Could not load tabs')
      })
      .finally(() => {
        if (!cancelled) setTabsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [accountId, spreadsheetId])

  const sheet = useMemo(
    () => spreadsheets.find((item) => item.id === spreadsheetId) ?? null,
    [spreadsheets, spreadsheetId],
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return spreadsheets
    return spreadsheets.filter((item) => (item.name || '').toLowerCase().includes(needle))
  }, [spreadsheets, query])

  const tabOptions = useMemo(
    () => tabs.map((item) => ({ value: item.title, label: item.title || 'Untitled' })),
    [tabs],
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
      if (err instanceof GoogleSheetsRevokedError) {
        setConnected(false)
        setError(revokedMessage())
        return
      }
      setError(err instanceof Error ? err.message : 'Could not import that sheet')
    } finally {
      setBusy(false)
    }
  }

  if (connected !== true) {
    return (
      <div className="rounded-[8px] bg-mk-raised px-4 py-4">
        {connected === null ? (
          <p className="flex items-center gap-2 text-[13px] text-mk-ink-muted" role="status">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
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

      {listing ? (
        <p className="flex items-center gap-2 text-[13px] text-mk-ink-muted" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          Loading spreadsheets…
        </p>
      ) : spreadsheets.length === 0 ? (
        <p className="text-[13px] text-mk-ink-muted">No spreadsheets in that Google account.</p>
      ) : (
        <div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a spreadsheet"
            aria-label="Find a spreadsheet"
            className={appField}
          />
          {visible.length === 0 ? (
            <p className="mt-3 text-[13px] text-mk-ink-muted">No spreadsheets match.</p>
          ) : (
            <ul className="mt-2 max-h-52 divide-y divide-mk-line overflow-y-auto rounded-[8px] border border-mk-line">
              {visible.map((item) => {
                const on = item.id === spreadsheetId
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={disabled || busy}
                      onClick={() => setSpreadsheetId(item.id)}
                      aria-pressed={on}
                      className={`flex w-full items-baseline justify-between gap-3 px-3 py-2.5 text-left transition-colors disabled:opacity-50 ${
                        on ? 'bg-mk-raised text-mk-ink' : 'text-mk-ink hover:bg-mk-raised/70'
                      }`}
                    >
                      <span className="min-w-0 truncate text-[13px]">{item.name || 'Untitled spreadsheet'}</span>
                      {item.modified_at ? (
                        <span className="shrink-0 text-[12px] text-mk-ink-subtle">
                          {formatUploadedAt(item.modified_at)}
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {spreadsheetId ? (
        <div>
          <p className="mb-2 text-[12px] font-medium text-mk-ink-subtle">Tab</p>
          {tabsLoading ? (
            <p className="flex items-center gap-2 text-[13px] text-mk-ink-muted" role="status">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              Loading tabs…
            </p>
          ) : tabs.length === 0 ? (
            <p className="text-[13px] text-mk-ink-muted">No tabs in that spreadsheet.</p>
          ) : (
            <AppPicker
              label="Tab"
              value={tab}
              options={tabOptions}
              onChange={setTab}
              disabled={disabled || busy}
              placeholder="Choose a tab"
            />
          )}
        </div>
      ) : null}

      {tab ? (
        <button
          type="button"
          className={appPrimaryBtn}
          disabled={disabled || busy}
          onClick={() => void handleImport()}
        >
          {busy ? 'Adding…' : 'Add this sheet'}
        </button>
      ) : null}
    </div>
  )
}
