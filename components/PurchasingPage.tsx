'use client'

import { useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { placeOrder, quotePurchase } from '@/lib/api'
import type { PurchaseStatus } from '@/lib/types'

function statusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'not_implemented':
      return 'Not implemented'
  }
}

export default function PurchasingPage() {
  const [busy, setBusy] = useState<'quote' | 'order' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runAction(kind: 'quote' | 'order') {
    setBusy(kind)
    setError(null)
    setMessage(null)

    const request = {
      provider: 'digikey' as const,
      lines: [{ mpn: 'PLACEHOLDER', quantity: 1 }],
    }

    try {
      const response =
        kind === 'quote' ? await quotePurchase(request) : await placeOrder(request)
      setMessage(
        `${kind === 'quote' ? 'Quote' : 'Place order'}: ${statusLabel(response.status)}.`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardShell>
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
            Quote and order parts across distributors. Prokuro compares availability and pricing,
            then routes each line to the cheapest in-stock offer.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] space-y-4 px-6 py-8">
        <div className="border border-slate-200 bg-white">
          <div className="px-5 py-10 text-center">
            <p className="text-[16px] font-medium text-slate-800">
              Purchasing is not implemented yet
            </p>
            <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
              The API skeleton is wired. Real quote and order flows will compare offers across
              distributors and select the best price automatically.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => void runAction('quote')}
                className="border border-slate-900 bg-slate-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'quote' ? 'Quoting…' : 'Quote BOM'}
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
    </DashboardShell>
  )
}
