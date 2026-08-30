'use client'

import { useEffect, useState } from 'react'
import { searchCrmAccounts, syncBomToCrm } from '@/lib/api'
import type { CrmAccount, CrmSyncResponse } from '@/lib/types'

export default function CrmSyncDialog({
  bomId,
  bomName,
  open,
  onClose,
}: {
  bomId: string
  bomName: string
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState(bomName)
  const [accounts, setAccounts] = useState<CrmAccount[]>([])
  const [selected, setSelected] = useState<CrmAccount | null>(null)
  const [searching, setSearching] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<CrmSyncResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setAccounts([])
      setSelected(null)
      setResult(null)
      setError(null)
    }
  }, [open])

  if (!open) return null

  async function runSearch() {
    setSearching(true)
    setError(null)
    setResult(null)
    try {
      const found = await searchCrmAccounts(query.trim())
      setAccounts(found)
      if (found.length === 0) setError('No matching accounts in your CRM.')
    } catch (err) {
      setAccounts([])
      setError(err instanceof Error ? err.message : 'CRM search failed')
    } finally {
      setSearching(false)
    }
  }

  async function runSync() {
    if (!selected) return
    setSyncing(true)
    setError(null)
    try {
      setResult(await syncBomToCrm(bomId, selected.id))
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'CRM sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden border border-slate-200 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div>
            <h2 className="text-[15px] font-semibold text-[#0f1b2d]">Log risk to CRM</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">
              Posts this BOM&apos;s risk summary as a note on the account.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] font-semibold text-slate-500 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {result ? (
            <div className="space-y-3">
              <p className="text-[13px] text-[#167c48]">
                Logged to the CRM account. Note ID {result.note_id}.
              </p>
              <pre className="max-h-64 overflow-auto border border-slate-200 bg-[#f4f6f9] p-3 font-mono text-[12px] whitespace-pre-wrap text-slate-700">
                {result.body}
              </pre>
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2">
                <label className="flex-1">
                  <span className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">
                    Account
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void runSearch()
                    }}
                    placeholder="Search CRM companies"
                    className="mt-1 w-full border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-[#0062ff] focus:outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void runSearch()}
                  disabled={searching || query.trim().length === 0}
                  className="border border-slate-300 bg-white px-3 py-1.5 text-[13px] font-medium text-slate-800 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searching ? 'Searching…' : 'Search'}
                </button>
              </div>

              {accounts.length > 0 ? (
                <ul className="divide-y divide-slate-100 border border-slate-200">
                  {accounts.map((account) => (
                    <li key={account.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(account)}
                        className={`flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${
                          selected?.id === account.id ? 'bg-[#0062ff]/5' : ''
                        }`}
                      >
                        <span className="text-slate-900">{account.name}</span>
                        {account.domain ? (
                          <span className="font-mono text-[11px] text-slate-400">
                            {account.domain}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}

          {error ? <p className="font-mono text-[12px] text-[#c62026]">{error}</p> : null}
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3">
          {result ? (
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-900 bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800"
            >
              Done
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void runSync()}
              disabled={!selected || syncing}
              className="border border-slate-900 bg-slate-900 px-4 py-2 text-[13px] font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {syncing ? 'Logging…' : 'Log to CRM'}
            </button>
          )}
          {selected && !result ? (
            <p className="text-[12px] text-slate-500">{selected.name}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
