'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { placeOrder, quotePurchase, suggestParts } from '@/lib/api'
import { useBuyBoards } from '@/hooks/use-buy-boards'
import { useSourcingRun } from '@/hooks/use-sourcing-run'
import { useTeam } from '@/hooks/use-team'
import PageHeader from '@/components/app/PageHeader'
import CartPanel from '@/components/sourcing/CartPanel'
import PartsCatalog from '@/components/sourcing/PartsCatalog'
import SourcingPlanPanel from '@/components/sourcing/SourcingPlan'
import { PAGE } from '@/lib/pageTitle'
import {
  appContainer,
  appField,
  appGhostBtn,
  appPage,
  appQtyField,
  appSheet,
  appTextBtn,
} from '@/components/app/chrome'
import {
  addToCart,
  aiSuggestions,
  buildCatalog,
  buildSuggestions,
  CART_STORAGE_KEY,
  cartLineFrom,
  DISMISSED_STORAGE_KEY,
  parseStoredCart,
  removeFromCart,
  setCartQuantity,
  type CartLine,
  type Suggestion,
} from '@/lib/cart'
import { buyerMessage, money, SOURCING_PROVIDER, statusLabel } from '@/lib/purchaseDisplay'
import {
  applyPlan,
  cartPlanView,
  MAX_RUN_LINES,
  parseStoredPlan,
  pendingChanges,
  PLAN_STORAGE_KEY,
  planCsv,
  planMatchesCart,
  plannedTotal,
  runRequest,
  swappedInCart,
  type StoredPlan,
} from '@/lib/sourcingPlan'
import type { PartSuggestion, PlaceOrderResponse, QuoteResponse, SourcingRun } from '@/lib/types'

function cartSignature(cart: CartLine[]): string {
  return `${cart.map((line) => `${line.key}:${line.quantity}`).join(',')}`
}

function downloadCsv(csv: string) {
  const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `prokuro-sourcing-plan-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function readDismissed(): Set<string> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(DISMISSED_STORAGE_KEY) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set()
  }
}

export default function SourcingPage() {
  const { canWrite, error: teamError, reload: reloadTeam, loaded: teamLoaded, team } = useTeam()
  const { boards, loading: boardsLoading, error: boardsError, failed } = useBuyBoards()
  const catalog = useMemo(() => buildCatalog(boards), [boards])

  const [cart, setCart] = useState<CartLine[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)
  const [poNumber, setPoNumber] = useState('')
  const [busy, setBusy] = useState<'quote' | 'order' | 'lookup' | null>(null)
  const [quote, setQuote] = useState<QuoteResponse | null>(null)
  const [quotedFor, setQuotedFor] = useState<string | null>(null)
  const [order, setOrder] = useState<PlaceOrderResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [lookupMpn, setLookupMpn] = useState('')
  const [lookupQty, setLookupQty] = useState('1')
  const [lookup, setLookup] = useState<QuoteResponse | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)

  const sourcing = useSourcingRun()
  const { phase, resume: resumeRun, reset: resetRun, start: startRun } = sourcing
  const [planRun, setPlanRun] = useState<SourcingRun | null>(null)
  const [planAt, setPlanAt] = useState<number | null>(null)
  const [swaps, setSwaps] = useState<Set<string>>(new Set())
  const [appliedNote, setAppliedNote] = useState<string | null>(null)
  const planRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setCart(parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)))
    setDismissed(readDismissed())
    const stored = parseStoredPlan(window.localStorage.getItem(PLAN_STORAGE_KEY))
    if (stored) {
      setPlanRun(stored.run)
      setPlanAt(stored.finishedAt)
      setSwaps(new Set(stored.swaps))
      if (stored.runId) resumeRun(stored.runId)
    }
    setHydrated(true)
  }, [resumeRun])

  useEffect(() => {
    if (phase.kind !== 'done') return
    setPlanRun(phase.run)
    setPlanAt(Date.now())
    setSwaps(new Set())
    setAppliedNote(null)
    setQuote(null)
  }, [phase])

  const followingId = phase.kind === 'running' || phase.kind === 'offline' ? phase.runId : null
  useEffect(() => {
    if (!hydrated) return
    if (!followingId && !planRun) {
      window.localStorage.removeItem(PLAN_STORAGE_KEY)
      return
    }
    const stored: StoredPlan = {
      runId: followingId,
      run: planRun,
      swaps: [...swaps],
      finishedAt: planAt,
      savedAt: Date.now(),
    }
    try {
      window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(stored))
    } catch {
      // Storage full or blocked: the plan still works for this visit.
    }
  }, [followingId, planRun, planAt, swaps, hydrated])

  useEffect(() => {
    if (!appliedNote) return
    const id = window.setTimeout(() => setAppliedNote(null), 6000)
    return () => window.clearTimeout(id)
  }, [appliedNote])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  }, [cart, hydrated])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed]))
  }, [dismissed, hydrated])

  const [aiParts, setAiParts] = useState<PartSuggestion[]>([])
  const [aiBusy, setAiBusy] = useState(false)
  const [aiNote, setAiNote] = useState<string | null>(null)

  const suggestions = useMemo(
    () => [...aiSuggestions(aiParts, cart, dismissed), ...buildSuggestions(cart, catalog, boards, dismissed)],
    [aiParts, cart, catalog, boards, dismissed],
  )

  async function askAi() {
    setAiBusy(true)
    setAiNote(null)
    try {
      const response = await suggestParts({
        provider: SOURCING_PROVIDER,
        lines: cart.map((line) => ({
          mpn: line.mpn,
          quantity: line.quantity,
          ...(line.manufacturer ? { manufacturer: line.manufacturer } : {}),
          ...(line.description ? { description: line.description } : {}),
        })),
      })
      setAiParts(response.suggestions)
      if (response.suggestions.length === 0) {
        setAiNote(
          response.status === 'ok'
            ? 'Nothing obviously missing from this cart.'
            : response.status === 'disabled'
              ? 'AI suggestions aren’t switched on yet.'
              : 'No suggestions right now. Try again in a minute.',
        )
      }
    } catch {
      setAiNote('No suggestions right now. Try again in a minute.')
    } finally {
      setAiBusy(false)
    }
  }
  const quoteStale = quote != null && quotedFor !== cartSignature(cart)

  const plan = planRun?.plan ?? null
  const planCurrent = plan != null && planMatchesCart(plan, cart)
  const lockedSwaps = useMemo(() => (plan ? swappedInCart(cart, plan) : new Set<string>()), [cart, plan])
  const activeSwaps = useMemo(() => new Set([...swaps, ...lockedSwaps]), [swaps, lockedSwaps])
  const pending = plan ? pendingChanges(cart, plan, activeSwaps) : { raise: 0, swap: 0 }
  const planView = useMemo(
    () => (plan && planCurrent ? cartPlanView(plan, activeSwaps) : null),
    [plan, planCurrent, activeSwaps],
  )
  const sourcingBusy = phase.kind === 'starting' || phase.kind === 'running'
  const tooManyLines = cart.length > MAX_RUN_LINES
  const canSource = canWrite && cart.length > 0 && !tooManyLines && !sourcingBusy && busy === null
  const showPlan = plan != null || phase.kind !== 'idle'

  function add(lines: CartLine[]) {
    setCart((current) => addToCart(current, lines))
    setOrder(null)
  }

  function dismiss(suggestion: Suggestion) {
    setDismissed((current) => new Set([...current, ...suggestion.keys]))
  }

  function requestLines() {
    return cart.map((line) => ({
      mpn: line.mpn,
      quantity: line.quantity,
      ...(line.manufacturer ? { manufacturer: line.manufacturer } : {}),
    }))
  }

  async function priceCart() {
    setBusy('quote')
    setError(null)
    setOrder(null)
    const signature = cartSignature(cart)
    try {
      setQuote(await quotePurchase({ provider: SOURCING_PROVIDER, lines: requestLines() }))
      setQuotedFor(signature)
    } catch (err) {
      setQuote(null)
      setError(err instanceof Error ? err.message : 'Pricing failed')
    } finally {
      setBusy(null)
    }
  }

  async function sourceCart() {
    if (!canSource) return
    setError(null)
    setOrder(null)
    setAppliedNote(null)
    window.requestAnimationFrame(() => planRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }))
    const outcome = await startRun(runRequest(cart, catalog))
    if (outcome === 'unsupported') await priceCart()
  }

  function applySourcingPlan() {
    if (!plan || !planCurrent) return
    const result = applyPlan(cart, plan, activeSwaps)
    setCart(result.cart)
    setOrder(null)
    const parts = [
      result.raised > 0 ? `${result.raised} ${result.raised === 1 ? 'line' : 'lines'} raised to the planned quantity` : null,
      result.swapped > 0 ? `${result.swapped} ${result.swapped === 1 ? 'alternate' : 'alternates'} swapped in` : null,
    ].filter(Boolean)
    setAppliedNote(parts.length > 0 ? `Cart updated: ${parts.join(', ')}.` : 'Your cart already matches this plan.')
  }

  function closePlan() {
    resetRun()
    setPlanRun(null)
    setPlanAt(null)
    setSwaps(new Set())
    setAppliedNote(null)
  }

  async function submitOrder() {
    setBusy('order')
    setError(null)
    try {
      setOrder(
        await placeOrder({
          provider: SOURCING_PROVIDER,
          lines: requestLines(),
          purchase_order_number: poNumber.trim() || undefined,
        }),
      )
    } catch (err) {
      setOrder(null)
      setError(err instanceof Error ? err.message : 'Order failed')
    } finally {
      setBusy(null)
    }
  }

  async function runLookup(event: React.FormEvent) {
    event.preventDefault()
    const mpn = lookupMpn.trim()
    if (!mpn) return
    setBusy('lookup')
    setLookupError(null)
    try {
      setLookup(await quotePurchase({ provider: SOURCING_PROVIDER, lines: [{ mpn, quantity: 1 }] }))
    } catch (err) {
      setLookup(null)
      setLookupError(err instanceof Error ? err.message : 'Lookup failed')
    } finally {
      setBusy(null)
    }
  }

  const lookupLine = lookup?.lines?.[0] ?? null
  const writeBlockedNote =
    teamLoaded && !team && teamError ? (
      <>
        Couldn’t check who can buy ({teamError}).{' '}
        <button type="button" className="font-semibold text-mk-accent underline" onClick={() => reloadTeam()}>
          Retry
        </button>
      </>
    ) : teamLoaded ? (
      'Your seat can browse and build a cart, not price or order.'
    ) : (
      'Checking your seat…'
    )

  return (
    <div className={appPage}>
      <PageHeader
        title={PAGE.sourcing}
        description="Every part on your boards, at the best price we can find. Build a cart, price it, and place the order once ordering is switched on for your account."
      />

      <div className={`${appContainer} grid grid-cols-[minmax(0,1fr)] gap-5 py-5 mk:py-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start`}>
        <div className="min-w-0 space-y-4">
          {showPlan ? (
            <div ref={planRef} className="scroll-mt-4">
              <SourcingPlanPanel
                phase={phase}
                plan={plan}
                finishedAt={planAt}
                current={planCurrent}
                cart={cart}
                swaps={activeSwaps}
                lockedSwaps={lockedSwaps}
                pending={pending}
                appliedNote={appliedNote}
                canRun={canSource}
                onRun={() => void sourceCart()}
                onResume={resumeRun}
                onToggleSwap={(key) =>
                  setSwaps((current) => {
                    const next = new Set(current)
                    if (next.has(key)) next.delete(key)
                    else next.add(key)
                    return next
                  })
                }
                onApply={applySourcingPlan}
                onDownload={() => plan && downloadCsv(planCsv(plan, activeSwaps))}
                onDismiss={closePlan}
              />
            </div>
          ) : null}

          <form onSubmit={(event) => void runLookup(event)} className={`${appSheet} px-4 py-3 sm:px-5`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label htmlFor="lookup-mpn" className="shrink-0 text-[13px] font-medium text-mk-ink">
                Not on a board?
              </label>
              <input
                id="lookup-mpn"
                value={lookupMpn}
                onChange={(event) => setLookupMpn(event.target.value)}
                placeholder="Exact part number, e.g. TPS62840DLCR"
                className={`${appField} mk-data flex-1`}
              />
              <button
                type="submit"
                disabled={!lookupMpn.trim() || busy !== null || !canWrite}
                className={`${appGhostBtn} shrink-0`}
              >
                {busy === 'lookup' ? 'Looking up…' : 'Check price'}
              </button>
            </div>
            <p className="mt-1.5 text-[12px] text-mk-ink-subtle">Each lookup uses one quote from your monthly sourcing allowance.</p>

            {lookupError ? <p className="mt-2 text-[13px] text-mk-red">{lookupError}</p> : null}
            {lookup && lookupLine && !lookupLine.error && lookupLine.unit_price != null ? (
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-mk-line pt-3">
                <div className="min-w-0 flex-1">
                  <p className="mk-data text-mk-ink">{lookupLine.matched_mpn ?? lookupLine.mpn}</p>
                  <p className="text-[12px] tabular-nums text-mk-ink-subtle">
                    {money(lookupLine.unit_price, lookupLine.currency ?? lookup.currency)} ea at qty 1 ·{' '}
                    {lookupLine.available_quantity?.toLocaleString() ?? 'unknown'} in stock
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  aria-label="Quantity"
                  value={lookupQty}
                  onChange={(event) => setLookupQty(event.target.value)}
                  className={appQtyField}
                />
                <button
                  type="button"
                  className={appTextBtn}
                  onClick={() => {
                    add([
                      cartLineFrom(
                        { mpn: lookupLine.matched_mpn ?? lookupLine.mpn },
                        Number.parseInt(lookupQty, 10) || 1,
                      ),
                    ])
                    setLookup(null)
                    setLookupMpn('')
                    setLookupQty('1')
                  }}
                >
                  Add to cart
                </button>
              </div>
            ) : lookup ? (
              <p className="mt-2 text-[13px] text-mk-ink-muted">
                {lookupLine?.error
                  ? 'No price found for this part number. Check it and try again.'
                  : (buyerMessage(lookup.status, lookup.message) ?? `${statusLabel(lookup.status)}.`)}
              </p>
            ) : null}
          </form>

          <PartsCatalog
            boards={boards}
            catalog={catalog}
            cart={cart}
            loading={boardsLoading}
            error={boardsError}
            failed={failed}
            onAdd={add}
          />
        </div>

        <aside className="lg:sticky lg:top-4">
          <CartPanel
            cart={cart}
            quote={quote}
            quoteStale={quoteStale}
            order={order}
            busy={busy}
            error={error}
            canWrite={canWrite}
            writeBlockedNote={writeBlockedNote}
            poNumber={poNumber}
            onPoNumber={setPoNumber}
            onQuantity={(key, quantity) => setCart((current) => setCartQuantity(current, key, quantity))}
            onRemove={(key) => setCart((current) => removeFromCart(current, key))}
            onClear={() => {
              closePlan()
              setCart([])
              setDismissed(new Set())
              setAiParts([])
              setAiNote(null)
              setQuote(null)
              setOrder(null)
            }}
            onSource={() => void sourceCart()}
            sourcing={sourcingBusy}
            canSource={canSource}
            tooManyLines={tooManyLines}
            planView={planView}
            hasPlan={plan != null}
            planTotal={plan && planCurrent ? { total: plannedTotal(plan, activeSwaps), currency: plan.currency } : null}
            onOrder={() => void submitOrder()}
            suggestions={suggestions}
            onAcceptSuggestion={(suggestion) => {
              add(suggestion.add)
              dismiss(suggestion)
            }}
            onDismissSuggestion={dismiss}
            onAskAi={() => void askAi()}
            aiBusy={aiBusy}
            aiNote={aiNote}
          />
        </aside>
      </div>
    </div>
  )
}
