'use client'

import { useState } from 'react'
import { placeOrder, quotePurchase } from '@/lib/api'
import { useTeam } from '@/hooks/use-team'
import BomPartPicker from '@/components/purchasing/BomPartPicker'
import { mergeDraftLines, type DraftLine, type SourcedPart } from '@/lib/purchasing'
import type {
  PlaceOrderResponse,
  PurchaseProviderId,
  PurchaseStatus,
  QuoteLineResult,
  QuoteResponse,
} from '@/lib/types'

function statusLabel(status: PurchaseStatus): string {
  switch (status) {
    case 'quoted':
      return 'Quoted'
    case 'partial':
      return 'Partial quote'
    case 'unavailable':
      return 'Unavailable'
    case 'submitted':
      return 'Order submitted'
    case 'not_configured':
      return 'Distributor API not configured'
    case 'requires_distributor_credit':
      return 'Distributor credit required'
    case 'requires_subscription':
      return 'Subscription required'
    case 'cap_exceeded':
      return 'Plan purchasing cap exceeded'
    case 'error':
      return 'Provider error'
  }
}

function money(value: number | null | undefined, currency?: string | null): string {
  if (value == null) return '—'
  const code = currency ?? 'USD'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(value)
  } catch {
    return `${value.toFixed(4)} ${code}`
  }
}

export default function PurchasingPage() {
  const { canWrite, error: teamError, reload: reloadTeam, loaded: teamLoaded, team } = useTeam()
  const [provider, setProvider] = useState<PurchaseProviderId>('digikey')
  const [lines, setLines] = useState<DraftLine[]>([{ mpn: '', quantity: '1' }])
  const [poNumber, setPoNumber] = useState('')
  const [busy, setBusy] = useState<'quote' | 'order' | null>(null)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [order, setOrder] = useState<PlaceOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  function addParts(parts: SourcedPart[]) {
    const result = mergeDraftLines(lines, parts)
    setLines(result.lines)
    setError(null)
    setNotice(
      result.added === 0
        ? 'Those parts are already on the quote.'
        : `Added ${result.added} part${result.added === 1 ? '' : 's'}${
            result.skipped > 0 ? ` (${result.skipped} already on the quote)` : ''
          }.`,
    )
  }

  function updateLine(index: number, patch: Partial<DraftLine>) {
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  function addLine() {
    setLines((current) => [...current, { mpn: '', quantity: '1' }])
  }

  function removeLine(index: number) {
    setLines((current) => (current.length <= 1 ? current : current.filter((_, i) => i !== index)))
  }

  function parsedLines() {
    return lines
      .map((line) => ({
        mpn: line.mpn.trim(),
        quantity: Number.parseInt(line.quantity, 10),
      }))
      .filter((line) => line.mpn.length > 0 && Number.isFinite(line.quantity) && line.quantity > 0)
  }

  async function runQuote() {
    const requestLines = parsedLines()
    if (requestLines.length === 0) {
      setError('Add at least one MPN with quantity greater than zero.')
      return
    }
    setBusy('quote')
    setError(null)
    setNotice(null)
    setOrder(null)
    try {
      const response = await quotePurchase({ provider, lines: requestLines })
      setQuote(response)
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'Quote failed')
    } finally {
      setBusy(null)
    }
  }

  async function runOrder() {
    const requestLines = parsedLines()
    if (requestLines.length === 0) {
      setError('Add at least one MPN with quantity greater than zero.')
      return
    }
    setBusy('order')
    setError(null)
    setNotice(null)
    try {
      const response = await placeOrder({
        provider,
        lines: requestLines,
        purchase_order_number: poNumber.trim() || undefined,
      })
      setOrder(response)
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setBusy(null)
    }
  }

  const quoteLines: QuoteLineResult[] = quote?.lines ?? []

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
            Pull in-stock parts straight from your BOMs, quote Digi-Key and Mouser, then place
            orders when distributor credentials and ordering are enabled on the purchasing service.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1180px] space-y-4 px-6 py-8">
        <BomPartPicker onAdd={addParts} disabled={busy !== null || !canWrite} />

        <div className="border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Quote lines</h2>
            <p className="mt-1 text-[13px] text-slate-500">
              Add parts from a BOM above or enter MPNs by hand. Digi-Key ProductDetails and Mouser
              Search power quotes when credentials are configured.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <label className="block max-w-xs">
              <span className="font-mono text-[10px] uppercase tracking-[0.09em] text-slate-400">
                Distributor
              </span>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value as PurchaseProviderId)}
                className="mt-1 w-full border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-800 focus:border-[#0062ff] focus:outline-none focus:ring-1 focus:ring-[#0062ff]"
              >
                <option value="digikey">Digi-Key</option>
                <option value="mouser">Mouser</option>
              </select>
            </label>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-[#f4f6f9]">
                    <th className="px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      MPN
                    </th>
                    <th className="w-28 px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
                      Qty
                    </th>
                    <th className="w-20 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-3 py-2">
                        <input
                          value={line.mpn}
                          onChange={(event) => updateLine(index, { mpn: event.target.value })}
                          placeholder="e.g. LM358DR"
                          className="w-full border border-slate-200 px-2.5 py-1.5 font-mono text-[13px] focus:border-[#0062ff] focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) => updateLine(index, { quantity: event.target.value })}
                          className="w-full border border-slate-200 px-2.5 py-1.5 font-mono text-[13px] focus:border-[#0062ff] focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 1}
                          className="text-[12px] text-slate-400 hover:text-slate-700 disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={addLine}
                className="border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-700 hover:bg-slate-50"
              >
                Add line
              </button>
              <label className="ml-auto flex max-w-xs flex-1 items-center gap-2">
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-slate-400">
                  PO #
                </span>
                <input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  placeholder="Optional for order"
                  className="w-full border border-slate-200 px-2.5 py-1.5 text-[13px] focus:border-[#0062ff] focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                disabled={busy !== null || !canWrite}
                onClick={() => void runQuote()}
                className="border border-slate-900 bg-slate-900 px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'quote' ? 'Quoting…' : 'Get quote'}
              </button>
              <button
                type="button"
                disabled={busy !== null || !canWrite}
                onClick={() => void runOrder()}
                className="border border-slate-300 bg-white px-4 py-2 text-[13px] font-medium text-slate-800 transition-colors hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'order' ? 'Submitting…' : 'Place order'}
              </button>
              {teamLoaded && !canWrite ? (
                <p className="text-[12px] text-slate-400">
                  {!team && teamError ? (
                    <>
                      Team permissions unavailable ({teamError}).{' '}
                      <button
                        type="button"
                        className="font-semibold text-[#0062ff] underline"
                        onClick={() => reloadTeam()}
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    'Read-only members cannot quote or order.'
                  )}
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="font-mono text-[12px] text-[#c62026]">{error}</p>
            ) : notice ? (
              <p className="text-[12px] text-slate-500">{notice}</p>
            ) : null}
          </div>
        </div>

        {quote ? (
          <div className="border border-slate-200 bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold text-slate-900">Quote result</h2>
                <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-slate-500">
                  {quote.provider} · {statusLabel(quote.status)}
                </p>
              </div>
              {quote.subtotal != null ? (
                <p className="text-[15px] font-semibold text-slate-900">
                  Subtotal {money(quote.subtotal, quote.currency)}
                </p>
              ) : null}
            </div>
            {quote.message ? (
              <p className="border-b border-slate-100 px-5 py-3 text-[13px] text-slate-600">
                {quote.message}
              </p>
            ) : null}
            {quoteLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#f4f6f9]">
                      {['MPN', 'Matched', 'Qty', 'Unit', 'Extended', 'Available', 'Error'].map(
                        (header) => (
                          <th
                            key={header}
                            className="px-4 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400"
                          >
                            {header}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {quoteLines.map((line) => (
                      <tr key={`${line.mpn}-${line.quantity}`} className="border-b border-slate-100">
                        <td className="px-4 py-2.5 font-mono text-slate-900">{line.mpn}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-600">
                          {line.matched_mpn ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-700">{line.quantity}</td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-700">
                          {money(line.unit_price, line.currency ?? quote.currency)}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-700">
                          {money(line.extended_price, line.currency ?? quote.currency)}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-slate-700">
                          {line.available_quantity?.toLocaleString() ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[#c62026]">
                          {line.error ?? ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-6 text-[13px] text-slate-500">
                No line-level quote data returned. Status: {statusLabel(quote.status)}.
              </p>
            )}
          </div>
        ) : null}

        {order ? (
          <div className="border border-slate-200 bg-white px-5 py-4">
            <h2 className="text-[15px] font-semibold text-slate-900">Order result</h2>
            <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.08em] text-slate-500">
              {order.provider} · {statusLabel(order.status)}
            </p>
            {order.distributor_order_id ? (
              <p className="mt-2 text-[13px] text-slate-700">
                Distributor order ID: {order.distributor_order_id}
              </p>
            ) : null}
            {order.message ? (
              <p className="mt-2 text-[13px] text-slate-600">{order.message}</p>
            ) : order.status === 'requires_distributor_credit' ? (
              <p className="mt-2 text-[13px] text-slate-600">
                Ordering is off for this distributor (missing credit account / Order API approval, or
                DIGIKEY_ORDERING_ENABLED / MOUSER_ORDERING_ENABLED is false). Quotes still work.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
