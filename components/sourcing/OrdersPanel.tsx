'use client'

import { useCallback, useEffect, useState } from 'react'
import { listOrders } from '@/lib/api'
import { appSheet, appTextBtn } from '@/components/app/chrome'
import { buyerMessage, money, statusLabel } from '@/lib/purchaseDisplay'
import type { OrderRecord } from '@/lib/types'

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function OrdersPanel({ refreshKey = 0 }: { refreshKey?: number }) {
  const [orders, setOrders] = useState<OrderRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      setOrders(await listOrders())
    } catch (err) {
      setOrders(null)
      setError(err instanceof Error ? err.message : 'Could not load orders')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load, refreshKey])

  return (
    <section className={appSheet} aria-labelledby="orders-heading">
      <div className="flex items-baseline justify-between gap-2 border-b border-mk-line px-4 py-3">
        <h2 id="orders-heading" className="mk-app-heading text-mk-ink">
          Orders
        </h2>
        <button type="button" onClick={() => void load()} className={appTextBtn}>
          Refresh
        </button>
      </div>

      {error ? <p className="px-4 py-3 text-[12px] text-mk-red">{error}</p> : null}

      {orders == null && !error ? (
        <p className="px-4 py-3 text-[12px] text-mk-ink-subtle">Loading…</p>
      ) : null}

      {orders && orders.length === 0 ? (
        <p className="px-4 py-3 text-[12px] text-mk-ink-subtle">
          No confirmations yet. Place order on a cart to save one here — even while ordering is off.
        </p>
      ) : null}

      {orders && orders.length > 0 ? (
        <ul>
          {orders.map((order) => {
            const response = order.response
            const open = openId === order.order_id
            const lineCount = response.lines?.length ?? 0
            return (
              <li key={order.order_id} className="border-b border-mk-line last:border-b-0">
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left hover:bg-mk-raised"
                  onClick={() => setOpenId(open ? null : order.order_id)}
                  aria-expanded={open}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-mk-ink">
                      {order.order_id}
                      {response.purchase_order_number ? (
                        <span className="ml-2 font-normal text-mk-ink-subtle">
                          PO {response.purchase_order_number}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-mk-ink-muted">
                      {statusLabel(response.status)}
                      {lineCount > 0
                        ? ` · ${lineCount} ${lineCount === 1 ? 'line' : 'lines'}`
                        : ''}
                      {response.submitted_at ? ` · ${formatWhen(response.submitted_at)}` : ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-[12px] text-mk-ink-subtle">{open ? 'Hide' : 'Show'}</span>
                </button>

                {open ? (
                  <div className="space-y-2 border-t border-mk-line bg-mk-canvas px-4 py-3">
                    <p className="text-[12px] text-mk-ink-muted">
                      {response.distributor_order_id
                        ? `Supplier order ${response.distributor_order_id}. `
                        : ''}
                      {buyerMessage(response.status, response.message)
                        ? buyerMessage(response.status, response.message)
                        : response.status === 'not_configured' ||
                            response.status === 'requires_distributor_credit'
                          ? 'Pricing still works. Prokuro will place orders for you once ordering is on.'
                          : null}
                    </p>
                    {response.ship_to ? (
                      <p className="text-[12px] text-mk-ink-muted">
                        Ship to{' '}
                        {[
                          response.ship_to.line1,
                          response.ship_to.city,
                          response.ship_to.region,
                          response.ship_to.postal_code,
                          response.ship_to.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    ) : null}
                    {(response.lines?.length ?? 0) > 0 ? (
                      <ul className="divide-y divide-mk-line border-t border-mk-line pt-1">
                        {response.lines!.map((line) => (
                          <li
                            key={`${line.mpn}-${line.quantity}`}
                            className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-1.5 text-[12px]"
                          >
                            <span className="font-medium text-mk-ink">{line.mpn}</span>
                            <span className="tabular-nums text-mk-ink-muted">
                              {line.quantity.toLocaleString()} pcs
                              {line.unit_price != null ? ` · ${money(line.unit_price, line.currency)}` : ''}
                              {line.extended_price != null
                                ? ` · ${money(line.extended_price, line.currency)} ext`
                                : ''}
                              {line.lead_time_days != null ? ` · ${line.lead_time_days}d lead` : ''}
                              {line.need_by ? ` · need ${line.need_by}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {response.tracking_number || response.carrier || response.estimated_delivery ? (
                      <p className="text-[12px] text-mk-ink-muted">
                        {[
                          response.carrier,
                          response.tracking_number,
                          response.estimated_delivery ? `ETA ${response.estimated_delivery}` : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
