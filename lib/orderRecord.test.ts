import { describe, expect, it } from 'vitest'
import { normalizeOrderRecord } from '@/lib/api'

describe('normalizeOrderRecord', () => {
  it('accepts snake_case ids', () => {
    expect(
      normalizeOrderRecord({
        order_id: 'ord-1',
        account_id: 'acct-a',
        response: { provider: 'digikey', status: 'requires_distributor_credit', lines: [] },
      }),
    ).toEqual({
      order_id: 'ord-1',
      account_id: 'acct-a',
      response: { provider: 'digikey', status: 'requires_distributor_credit', lines: [] },
    })
  })

  it('accepts camelCase gateway OrderRecord wrappers', () => {
    expect(
      normalizeOrderRecord({
        orderId: 'ord-2',
        accountId: 'acct-b',
        response: { provider: 'digikey', status: 'not_configured' },
      }),
    ).toEqual({
      order_id: 'ord-2',
      account_id: 'acct-b',
      response: { provider: 'digikey', status: 'not_configured' },
    })
  })

  it('drops incomplete or hostile payloads', () => {
    expect(normalizeOrderRecord(null)).toBeNull()
    expect(normalizeOrderRecord({})).toBeNull()
    expect(normalizeOrderRecord({ orderId: 'ord-3' })).toBeNull()
    expect(normalizeOrderRecord({ orderId: 'ord-3', response: 'nope' })).toBeNull()
    expect(normalizeOrderRecord({ order_id: '', account_id: 'a', response: {} })).toBeNull()
  })
})
