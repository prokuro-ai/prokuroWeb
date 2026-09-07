'use client'

import { useState } from 'react'
import { placeOrder, quotePurchase } from '@/lib/api'
import { useTeam } from '@/hooks/use-team'
import PageHeader from '@/components/app/PageHeader'
import { appField, appGhostBtn, appPage, appPrimaryBtn, appSheet } from '@/components/app/chrome'
import type {
  PlaceOrderResponse,
  PurchaseProviderId,
  PurchaseStatus,
  QuoteLineResult,
  QuoteResponse,
} from '@/lib/types'

type DraftLine = { mpn: string; quantity: string }

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
      return 'Distributor not connected yet'
    case 'requires_distributor_credit':
      return 'Distributor credit required'
    case 'requires_subscription':
      return 'Paid plan required'
    case 'cap_exceeded':
      return 'This month’s buy limit is used up'
    case 'error':
      return 'Could not reach the distributor'
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
      setError('Add at least one part number with a quantity.')
      return
    }
    setBusy('quote')
    setError(null)
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
      setError('Add at least one part number with a quantity.')
      return
    }
    setBusy('order')
    setError(null)
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
    <div className={appPage}>
      <PageHeader
        title="Get a quote"
        description="Enter part numbers and quantities. We’ll price them at Digi-Key or Mouser. Placing the order stays off until your distributor account is connected."
      />

      <div className="mx-auto max-w-[1180px] space-y-4 px-6 py-8">
        <div className={appSheet}>
          <div className="border-b border-mk-line px-5 py-4">
            <h2 className="font-mk-display text-[22px] text-mk-ink">Parts to buy</h2>
            <p className="mt-1 text-[13px] text-mk-ink-muted">
              One part number per row. Add a PO number only if you are ready to place the order.
            </p>
          </div>

          <div className="space-y-4 px-5 py-5">
            <label className="block max-w-xs">
              <span className="mk-eyebrow">Distributor</span>
              <select
                value={provider}
                onChange={(event) => setProvider(event.target.value as PurchaseProviderId)}
                className={`${appField} mt-1`}
              >
                <option value="digikey">Digi-Key</option>
                <option value="mouser">Mouser</option>
              </select>
            </label>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left text-[13px]">
                <thead>
                  <tr className="border-b border-mk-line bg-mk-raised">
                    <th className="px-3 py-2 text-left">
                      <span className="mk-eyebrow">Part number</span>
                    </th>
                    <th className="w-28 px-3 py-2 text-left">
                      <span className="mk-eyebrow">Qty</span>
                    </th>
                    <th className="w-20 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index} className="border-b border-mk-line">
                      <td className="px-3 py-2">
                        <input
                          value={line.mpn}
                          onChange={(event) => updateLine(index, { mpn: event.target.value })}
                          placeholder="Part number"
                          className={`${appField} mk-data`}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(event) => updateLine(index, { quantity: event.target.value })}
                          className={`${appField} mk-data`}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={lines.length <= 1}
                          className="text-[12px] text-mk-ink-subtle hover:text-mk-ink disabled:opacity-40"
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
              <button type="button" onClick={addLine} className={appGhostBtn}>
                Add line
              </button>
              <label className="ml-auto flex max-w-xs flex-1 items-center gap-2">
                <span className="mk-eyebrow shrink-0">PO #</span>
                <input
                  value={poNumber}
                  onChange={(event) => setPoNumber(event.target.value)}
                  placeholder="Optional"
                  className={appField}
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-mk-line pt-4">
              <button
                type="button"
                disabled={busy !== null || !canWrite}
                onClick={() => void runQuote()}
                className={appPrimaryBtn}
              >
                {busy === 'quote' ? 'Quoting…' : 'Get a quote'}
              </button>
              <button
                type="button"
                disabled={busy !== null || !canWrite}
                onClick={() => void runOrder()}
                className={appGhostBtn}
              >
                {busy === 'order' ? 'Submitting…' : 'Place order'}
              </button>
              {teamLoaded && !canWrite ? (
                <p className="text-[12px] text-mk-ink-subtle">
                  {!team && teamError ? (
                    <>
                      Couldn’t check who can buy ({teamError}).{' '}
                      <button
                        type="button"
                        className="font-semibold text-mk-accent underline"
                        onClick={() => reloadTeam()}
                      >
                        Retry
                      </button>
                    </>
                  ) : (
                    'Your seat can view quotes, not place them.'
                  )}
                </p>
              ) : null}
            </div>

            {error ? <p className="text-[13px] text-mk-red">{error}</p> : null}
          </div>
        </div>

        {quote ? (
          <div className={appSheet}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-mk-line px-5 py-4">
              <div>
                <h2 className="font-mk-display text-[22px] text-mk-ink">Quote</h2>
                <p className="mt-1 text-[13px] text-mk-ink-muted">
                  {quote.provider} · {statusLabel(quote.status)}
                </p>
              </div>
              {quote.subtotal != null ? (
                <p className="font-mk-display text-[20px] text-mk-ink">
                  {money(quote.subtotal, quote.currency)}
                </p>
              ) : null}
            </div>
            {quote.message ? (
              <p className="border-b border-mk-line px-5 py-3 text-[13px] text-mk-ink-muted">{quote.message}</p>
            ) : null}
            {quoteLines.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-mk-line bg-mk-raised">
                      {['Part', 'Matched', 'Qty', 'Unit', 'Extended', 'Available', 'Note'].map((header) => (
                        <th key={header} className="px-4 py-2">
                          <span className="mk-eyebrow">{header}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {quoteLines.map((line) => (
                      <tr key={`${line.mpn}-${line.quantity}`} className="border-b border-mk-line">
                        <td className="px-4 py-2.5">
                          <span className="mk-data text-mk-ink">{line.mpn}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="mk-data text-mk-ink-muted">{line.matched_mpn ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-mk-ink">{line.quantity}</td>
                        <td className="px-4 py-2.5 tabular-nums text-mk-ink">
                          {money(line.unit_price, line.currency ?? quote.currency)}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-mk-ink">
                          {money(line.extended_price, line.currency ?? quote.currency)}
                        </td>
                        <td className="px-4 py-2.5 tabular-nums text-mk-ink">
                          {line.available_quantity?.toLocaleString() ?? '—'}
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-mk-red">{line.error ?? ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-5 py-6 text-[13px] text-mk-ink-muted">
                No line prices came back. {statusLabel(quote.status)}.
              </p>
            )}
          </div>
        ) : null}

        {order ? (
          <div className={`${appSheet} px-5 py-4`}>
            <h2 className="font-mk-display text-[22px] text-mk-ink">Order</h2>
            <p className="mt-1 text-[13px] text-mk-ink-muted">
              {order.provider} · {statusLabel(order.status)}
            </p>
            {order.distributor_order_id ? (
              <p className="mt-2 text-[13px] text-mk-ink">Distributor order {order.distributor_order_id}</p>
            ) : null}
            {order.message ? (
              <p className="mt-2 text-[13px] text-mk-ink-muted">{order.message}</p>
            ) : order.status === 'requires_distributor_credit' ? (
              <p className="mt-2 text-[13px] text-mk-ink-muted">
                Quotes still work. Placing the order needs a credit account at this distributor.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
