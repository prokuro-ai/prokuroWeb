import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  getIdToken: vi.fn(async () => 'test-token'),
}))

describe('startCheckout', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it('posts return_url and returns client_secret for embedded checkout', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ client_secret: 'cs_test_secret' }),
    }))
    vi.stubGlobal('fetch', fetchMock)

    const { startCheckout } = await import('@/lib/api')
    const secret = await startCheckout(
      'growth',
      'https://app.example/billing?billing=success&session_id={CHECKOUT_SESSION_ID}',
    )

    expect(secret).toBe('cs_test_secret')
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/billing/checkout',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          plan: 'growth',
          return_url:
            'https://app.example/billing?billing=success&session_id={CHECKOUT_SESSION_ID}',
        }),
      }),
    )
  })
})
