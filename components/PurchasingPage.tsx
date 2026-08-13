'use client'

import { useState } from 'react'
import { placeOrder, quotePurchase } from '@/lib/api'
import type { PurchaseProviderId, PurchaseStatus } from '@/lib/types'

const PROVIDERS: { id: PurchaseProviderId; label: string }[] = [
  { id: 'digikey', label: 'DigiKey' },
  { id: 'mouser', label: 'Mouser' },
]

function statusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'not_implemented':
      return 'Not implemented'
  }
}

type PurchasingPageProps = {
  /** Demo mode skips authenticated API calls. */
  demoMode?: boolean
}

export default function PurchasingPage({ demoMode = false }: PurchasingPageProps) {
  const [provider, setProvider] = useState<PurchaseProviderId>('digikey')
  const [busy, setBusy] = useState<'quote' | 'order' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const providerLabel = PROVIDERS.find((item) => item.id === provider)?.label ?? provider

  async function runAction(kind: 'quote' | 'order') {
    setBusy(kind)
    setError(null)
    setMessage(null)

    if (demoMode) {
      setMessage(`${kind === 'quote' ? 'Quote' : 'Place order'} via ${providerLabel} is not implemented yet.`)
      setBusy(null)
      return
    }

    const request = {
      provider,
      lines: [{ mpn: 'PLACEHOLDER', quantity: 1 }],
    }

    try {
      const response =
        kind === 'quote' ? await quotePurchase(request) : await placeOrder(request)
      setMessage(
        `${kind === 'quote' ? 'Quote' : 'Place order'}: ${statusLabel(response.status)} for ${providerLabel}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f4f6f9]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1180px] px-6 py-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-400">
            Fulfillment
          </p>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-slate-900">
            Purchasing
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-slate-500">
            Quote and order parts through distributor APIs.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] space-y-4 px-6 py-8">
        <div className="border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-200 bg-[#f4f6f9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-slate-500">
              Provider
            </p>
            <div className="flex border border-slate-200 bg-white p-0.5">
              {PROVIDERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setProvider(item.id)
                    setMessage(null)
                    setError(null)
                  }}
                  className={`px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.06em] transition-colors ${
                    provider === item.id
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-10 text-center">
            <p className="text-[16px] font-medium text-slate-800">
              {providerLabel} purchasing is not implemented yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              The API skeleton is wired. Real quote and order flows for DigiKey and Mouser will
              land here.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runAction('quote')}
                className="border border-slate-900 bg-slate-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'quote' ? 'Quoting…' : 'Quote'}
              </button>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runAction('order')}
                className="border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-800 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'order' ? 'Submitting…' : 'Place order'}
              </button>
            </div>

            {message ? (
              <p className="mt-4 font-mono text-[12px] text-slate-600">{message}</p>
            ) : null}
            {error ? (
              <p className="mt-4 font-mono text-[12px] text-[#c62026]">{error}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
