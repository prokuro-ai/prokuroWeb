import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getIdToken: vi.fn(async () => 'test-token'),
}))

function stubFetch(response: { ok: boolean; status?: number; json: () => Promise<unknown> }) {
  const fetchMock = vi.fn(async () => response)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('searchCrmAccounts', () => {
  it('returns the accounts from the search response', async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({
        provider: 'hubspot',
        accounts: [{ id: '1', name: 'Acme Robotics', domain: 'acme.com' }],
      }),
    })

    const { searchCrmAccounts } = await import('@/lib/api')
    const accounts = await searchCrmAccounts('acme')

    expect(accounts).toEqual([{ id: '1', name: 'Acme Robotics', domain: 'acme.com' }])
    expect(fetchMock).toHaveBeenCalledWith('/api/crm/accounts?query=acme', expect.anything())
  })

  it('returns an empty list when the CRM sends no accounts', async () => {
    stubFetch({ ok: true, json: async () => ({ provider: 'hubspot' }) })

    const { searchCrmAccounts } = await import('@/lib/api')

    await expect(searchCrmAccounts('acme')).resolves.toEqual([])
  })

  it('surfaces the gateway error message', async () => {
    stubFetch({
      ok: false,
      status: 502,
      json: async () => ({ error: 'CRM 401: expired token' }),
    })

    const { searchCrmAccounts } = await import('@/lib/api')

    await expect(searchCrmAccounts('acme')).rejects.toThrow('CRM 401: expired token')
  })
})

describe('syncBomToCrm', () => {
  it('posts the account id to the BOM sync endpoint', async () => {
    const fetchMock = stubFetch({
      ok: true,
      json: async () => ({
        provider: 'hubspot',
        account_id: '42',
        note_id: 'note-1',
        synced_at: '2026-08-30T00:00:00Z',
        body: 'Prokuro BOM risk — Power Board',
      }),
    })

    const { syncBomToCrm } = await import('@/lib/api')
    const result = await syncBomToCrm('bom 1', '42')

    expect(result.note_id).toBe('note-1')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/crm/boms/bom%201/sync',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ account_id: '42' }),
      }),
    )
  })
})

describe('getCrmStatus', () => {
  it('reports when no CRM is connected', async () => {
    stubFetch({ ok: true, json: async () => ({ configured: false }) })

    const { getCrmStatus } = await import('@/lib/api')

    await expect(getCrmStatus()).resolves.toEqual({ configured: false })
  })
})
