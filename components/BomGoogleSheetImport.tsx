'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { appField, appGhostBtn } from '@/components/app/chrome'
import { useSettings } from '@/components/settings/SettingsContext'
import {
  getGoogleSheetsStatus,
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
        if (!status.connected) return
        const files = await listGoogleSpreadsheets(accountId)
        if (!cancelled) setSpreadsheets(files)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load Google Sheets')
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

  const handleImport = async () => {
    const sheet = spreadsheets.find((item) => item.id === spreadsheetId)
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

  if (connected === false) {
    return (
      <p className="mt-4 text-[13px] text-mk-ink-muted">
        Google Sheets is not connected.{' '}
        {canManage ? (
          <button type="button" className="font-medium text-mk-accent" onClick={() => openSettings('integrations')}>
            Connect it in Settings
          </button>
        ) : (
          'Ask an owner or admin to connect it in Settings.'
        )}
      </p>
    )
  }

  if (connected !== true) {
    return (
      <p className="mt-4 flex items-center gap-2 text-[13px] text-mk-ink-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking Google Sheets…
      </p>
    )
  }

  return (
    <div className="mt-4 space-y-3">
      {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">Spreadsheet</span>
        <select
          className={appField}
          value={spreadsheetId}
          disabled={disabled || busy}
          onChange={(event) => setSpreadsheetId(event.target.value)}
        >
          <option value="">Select a spreadsheet</option>
          {spreadsheets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[12px] font-medium text-mk-ink-subtle">Tab</span>
        <select
          className={appField}
          value={tab}
          disabled={disabled || busy || !spreadsheetId}
          onChange={(event) => setTab(event.target.value)}
        >
          <option value="">{spreadsheetId ? 'Select a tab' : 'Pick a spreadsheet first'}</option>
          {tabs.map((item) => (
            <option key={`${item.sheet_id}-${item.title}`} value={item.title}>
              {item.title}
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={appGhostBtn}
        disabled={disabled || busy || !spreadsheetId || !tab}
        onClick={() => void handleImport()}
      >
        {busy ? 'Importing…' : 'Add sheet'}
      </button>
    </div>
  )
}
