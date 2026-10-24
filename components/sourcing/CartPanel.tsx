'use client'

import type { ReactNode } from 'react'
import { Sparkles, X } from 'lucide-react'
import { appField, appGhostBtn, appPrimaryBtn, appQtyField, appSheet, appTextBtn } from '@/components/app/chrome'
import type { CartLine, Suggestion } from '@/lib/cart'
import { MAX_RUN_LINES, type CartPlanLine, type Tone } from '@/lib/sourcingPlan'
import { buyerMessage, money, statusLabel } from '@/lib/purchaseDisplay'
import type { PlaceOrderResponse, QuoteLineResult, QuoteResponse } from '@/lib/types'

const PLAN_TONE: Record<Tone, string> = {
  good: 'text-mk-green',
  warn: 'text-mk-amber',
  bad: 'text-mk-red',
  muted: 'text-mk-ink-muted',
}

export default function CartPanel({
  cart,
  quote,
  quoteStale,
  order,
  busy,
  error,
  canWrite,
  writeBlockedNote,
  poNumber,
  onPoNumber,
  onQuantity,
  onFit,
  onRemove,
  onClear,
  onSource,
  sourcing,
  canSource,
  tooManyLines,
  planView,
  planTotal,
  hasPlan,
  onOrder,
  suggestions,
  onAcceptSuggestion,
  onDismissSuggestion,
  onAskAi,
  aiBusy,
  aiNote,
}: {
  cart: CartLine[]
  quote: QuoteResponse | null
  quoteStale: boolean
  order: PlaceOrderResponse | null
  busy: 'quote' | 'order' | 'lookup' | null
  error: string | null
  canWrite: boolean
  writeBlockedNote: ReactNode
  poNumber: string
  onPoNumber: (value: string) => void
  onQuantity: (key: string, quantity: number) => void
  onFit: (key: string, fit: string) => void
  onRemove: (key: string) => void
  onClear: () => void
  onSource: () => void
  sourcing: boolean
  canSource: boolean
  tooManyLines: boolean
  /** Present while a sourcing plan matches the cart. */
  planView: Map<string, CartPlanLine> | null
  planTotal: { total: number; currency: string } | null
  hasPlan: boolean
  onOrder: () => void
  suggestions: Suggestion[]
  onAcceptSuggestion: (suggestion: Suggestion) => void
  onDismissSuggestion: (suggestion: Suggestion) => void
  onAskAi: () => void
  aiBusy: boolean
  aiNote: string | null
}) {
  const priced = new Map<string, QuoteLineResult>()
  if (quote && !quoteStale) {
    for (const line of quote.lines ?? []) priced.set(line.mpn.trim().toUpperCase(), line)
  }
  const totalUnits = cart.reduce((sum, line) => sum + line.quantity, 0)

  return (
    <div className="space-y-4">
      <section className={appSheet} aria-labelledby="cart-heading">
        <div className="flex items-baseline justify-between gap-2 border-b border-mk-line px-4 py-3">
          <h2 id="cart-heading" className="mk-app-heading text-mk-ink">
            Cart
            <span className="ml-2 text-[13px] font-normal tabular-nums text-mk-ink-subtle">
              {cart.length} {cart.length === 1 ? 'line' : 'lines'} · {totalUnits.toLocaleString()} pcs
            </span>
          </h2>
          {cart.length > 0 ? (
            <button type="button" onClick={onClear} className="text-[12px] text-mk-ink-subtle hover:text-mk-ink">
              Clear
            </button>
          ) : null}
        </div>

        {cart.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-mk-ink-subtle">
            Nothing here yet. Add parts from your boards, or look up a part number.
          </p>
        ) : (
          <ul className="max-h-[22rem] overflow-y-auto">
            {cart.map((line) => {
              const planned = planView?.get(line.key)
              const price = planned ? undefined : priced.get(line.key)
              const short =
                price?.available_quantity != null && price.available_quantity < line.quantity
                  ? price.available_quantity
                  : null
              return (
                <li key={line.key} className="border-b border-mk-line px-4 py-2.5 last:border-b-0">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="mk-data truncate text-mk-ink">{line.mpn}</p>
                      {line.manufacturer || line.description ? (
                        <p className="truncate text-[12px] text-mk-ink-subtle">
                          {[line.manufacturer, line.description].filter(Boolean).join(' · ')}
                        </p>
                      ) : null}
                      <label className="mt-1.5 flex items-center gap-2 text-[12px] text-mk-ink-subtle">
                        <span className="shrink-0">Size</span>
                        <input
                          type="text"
                          aria-label={`Size of ${line.mpn}`}
                          value={line.fit ?? ''}
                          placeholder="0402"
                          onChange={(event) => onFit(line.key, event.target.value)}
                          className={`${appField} h-7 w-28 px-2 text-[12px]`}
                        />
                      </label>
                    </div>
                    <input
                      type="number"
                      min={1}
                      aria-label={`Quantity of ${line.mpn}`}
                      value={line.quantity}
                      onChange={(event) => onQuantity(line.key, Number.parseInt(event.target.value, 10))}
                      className={appQtyField}
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(line.key)}
                      aria-label={`Remove ${line.mpn}`}
                      className="mt-1.5 text-mk-ink-subtle hover:text-mk-ink"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </div>
                  {planned ? (
                    <p className="mt-1 flex justify-between gap-2 text-[12px] tabular-nums">
                      <span className="min-w-0 truncate">
                        <span className={PLAN_TONE[planned.tone]}>{planned.label}</span>
                        {planned.buy ? (
                          <span className="text-mk-ink-subtle">
                            {' '}
                            · {money(planned.buy.unit_price, planTotal?.currency)} ea
                            {planned.buy.quantity !== line.quantity
                              ? ` · plan buys ${planned.buy.quantity.toLocaleString()}`
                              : ''}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-mk-ink">
                        {planned.buy ? money(planned.buy.total, planTotal?.currency) : '—'}
                      </span>
                    </p>
                  ) : price ? (
                    <p className="mt-1 flex justify-between gap-2 text-[12px] tabular-nums">
                      {price.error ? (
                        <span className="text-mk-red">No price found for this part</span>
                      ) : (
                        <span className={short != null ? 'text-mk-red' : 'text-mk-ink-subtle'}>
                          {money(price.unit_price, price.currency ?? quote?.currency)} ea
                          {short != null ? ` · only ${short.toLocaleString()} in stock` : ''}
                          {price.matched_mpn && price.matched_mpn.toUpperCase() !== line.key
                            ? ` · matched ${price.matched_mpn}`
                            : ''}
                        </span>
                      )}
                      <span className="text-mk-ink">
                        {money(price.extended_price, price.currency ?? quote?.currency)}
                      </span>
                    </p>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}

        <div className="space-y-3 border-t border-mk-line px-4 py-4">
          {planTotal ? (
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-mk-ink-muted">Plan total</span>
              <span className="mk-app-heading tabular-nums text-mk-ink">
                {money(planTotal.total, planTotal.currency)}
              </span>
            </p>
          ) : quote && !quoteStale && quote.subtotal != null ? (
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[13px] text-mk-ink-muted">Subtotal</span>
              <span className="mk-app-heading tabular-nums text-mk-ink">
                {money(quote.subtotal, quote.currency)}
              </span>
            </p>
          ) : null}

          {quote && !planTotal ? (
            <p className="text-[12px] text-mk-ink-muted">
              {quoteStale
                ? 'Cart changed since the last price. Price it again.'
                : `${statusLabel(quote.status)}.${
                    buyerMessage(quote.status, quote.message) ? ` ${buyerMessage(quote.status, quote.message)}` : ''
                  }`}
            </p>
          ) : null}

          <div>
            <button type="button" disabled={!canSource} onClick={onSource} className={`${appPrimaryBtn} w-full`}>
              <Sparkles className="h-4 w-4" aria-hidden />
              {sourcing
                ? 'Sourcing…'
                : busy === 'quote'
                  ? 'Finding best prices…'
                  : hasPlan
                    ? 'Source again'
                    : 'Source this cart'}
            </button>
            {tooManyLines ? (
              <p className="mt-1.5 text-[12px] text-mk-red">
                Sourcing takes up to {MAX_RUN_LINES} lines at a time. Remove{' '}
                {(cart.length - MAX_RUN_LINES).toLocaleString()} or split the cart.
              </p>
            ) : cart.length > 0 && canWrite ? (
              <p className="mt-1.5 text-[12px] text-mk-ink-subtle">
                Compares sources, price breaks, and approved alternates for every line.
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <input
              value={poNumber}
              onChange={(event) => onPoNumber(event.target.value)}
              placeholder="PO number (optional)"
              aria-label="PO number"
              className={appField}
            />
            <button
              type="button"
              disabled={cart.length === 0 || busy !== null || sourcing || !canWrite}
              onClick={onOrder}
              className={`${appGhostBtn} shrink-0`}
            >
              {busy === 'order' ? 'Sending…' : 'Place order'}
            </button>
          </div>

          {order ? (
            <p className="text-[12px] text-mk-ink-muted">
              {statusLabel(order.status)}.
              {order.distributor_order_id ? ` Order ${order.distributor_order_id}.` : ''}
              {buyerMessage(order.status, order.message)
                ? ` ${buyerMessage(order.status, order.message)}`
                : order.status === 'not_configured' || order.status === 'requires_distributor_credit'
                  ? ' Pricing still works. Prokuro will place orders for you once ordering is on.'
                  : ''}
            </p>
          ) : null}
          {!canWrite ? <p className="text-[12px] text-mk-ink-subtle">{writeBlockedNote}</p> : null}
          {error ? <p className="text-[12px] text-mk-red">{error}</p> : null}
        </div>
      </section>

      {cart.length > 0 ? (
        <section className={appSheet} aria-labelledby="suggestions-heading">
          <div className="border-b border-mk-line px-4 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="suggestions-heading" className="mk-app-heading text-mk-ink">
                Worth adding
              </h2>
              <button
                type="button"
                onClick={onAskAi}
                disabled={aiBusy || !canWrite}
                className={appTextBtn}
              >
                {aiBusy ? 'Thinking…' : 'Ask AI what’s missing'}
              </button>
            </div>
            <p className="mt-0.5 text-[12px] text-mk-ink-subtle">
              Based on what’s in the cart. AI picks are checked for price and stock first. Check before you order.
            </p>
            {aiNote ? <p className="mt-1.5 text-[12px] text-mk-ink-muted">{aiNote}</p> : null}
          </div>
          <ul>
            {suggestions.map((suggestion) => (
              <li key={suggestion.id} className="border-b border-mk-line px-4 py-3 last:border-b-0">
                <p className="mk-eyebrow">{suggestion.source}</p>
                <p className="mt-1 text-[13px] font-medium text-mk-ink">{suggestion.title}</p>
                <p className="mt-0.5 text-[12px] text-mk-ink-muted">{suggestion.detail}</p>
                <div className="mt-2 flex items-center gap-4">
                  <button type="button" onClick={() => onAcceptSuggestion(suggestion)} className={appTextBtn}>
                    {suggestion.add.length === 1
                      ? `Add ${suggestion.add[0].quantity.toLocaleString()} pcs`
                      : `Add ${suggestion.add.length} lines`}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDismissSuggestion(suggestion)}
                    className="text-[12px] text-mk-ink-subtle hover:text-mk-ink"
                  >
                    Not now
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
