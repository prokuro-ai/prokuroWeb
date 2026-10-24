import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import SourcingPage from '@/components/SourcingPage'
import { getSourcingRun, quotePurchase, SourcingRunError, startSourcingRun } from '@/lib/api'
import { CART_STORAGE_KEY, cartLineFrom } from '@/lib/cart'
import { PLAN_STORAGE_KEY } from '@/lib/sourcingPlan'
import type { SourcingPlan, SourcingRun } from '@/lib/types'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    startSourcingRun: vi.fn(),
    getSourcingRun: vi.fn(),
    quotePurchase: vi.fn(),
    placeOrder: vi.fn(),
    suggestParts: vi.fn(),
  }
})

vi.mock('@/hooks/use-team', () => ({
  useTeam: () => ({ team: null, loaded: true, error: null, reload: vi.fn(), canWrite: true }),
}))

vi.mock('@/hooks/use-buy-boards', () => ({
  useBuyBoards: () => ({ boards: [], loading: false, error: null, failed: 0 }),
}))

const start = vi.mocked(startSourcingRun)
const get = vi.mocked(getSourcingRun)
const quote = vi.mocked(quotePurchase)

const PLAN: SourcingPlan = {
  currency: 'USD',
  total: 7.5,
  saved: 1.25,
  counts: { ready: 1, short: 0, out_of_stock: 1, no_price: 0, not_found: 1, ambiguous: 0, unchecked: 0, invalid: 0, swaps: 1 },
  sources_checked: 2,
  lines: [
    {
      mpn: 'A1',
      requested: 10,
      status: 'ready',
      buy: { mpn: 'A1', quantity: 25, unit_price: 0.3, total: 7.5, in_stock: 9000, sources: 1 },
      notes: [
        { kind: 'price_break', from: 10, to: 25, saves: 1.25 },
        { kind: 'compared_sources', sources: 2, saves: 0.4 },
      ],
      manufacturer: 'Acme',
      description: 'Regulator',
    },
    {
      mpn: 'B2',
      requested: 3,
      status: 'out_of_stock',
      notes: [{ kind: 'shortfall', available: 0, missing: 3 }],
      alternate: {
        mpn: 'B2-ALT',
        approved: true,
        reason: 'replaces_unavailable',
        buy: { mpn: 'B2-ALT', quantity: 10, unit_price: 0.2, total: 2, in_stock: 500, sources: 1 },
        manufacturer: 'Other',
      },
    },
    { mpn: 'C3', requested: 1, status: 'not_found', notes: [] },
  ],
}

function run(status: SourcingRun['status'], plan?: SourcingPlan): SourcingRun {
  return { id: 'run-1', status, progress: { stage: status === 'done' ? 'finishing' : 'pricing', done: 0, total: 3 }, plan }
}

function seedCart() {
  window.localStorage.setItem(
    CART_STORAGE_KEY,
    JSON.stringify([cartLineFrom({ mpn: 'A1' }, 10), cartLineFrom({ mpn: 'B2' }, 3), cartLineFrom({ mpn: 'C3' }, 1)]),
  )
}

function cartPanel(): HTMLElement {
  return screen.getByRole('region', { name: /^Cart/ })
}

function quantityOf(mpn: string): number | null {
  const input = screen.queryByLabelText(`Quantity of ${mpn}`) as HTMLInputElement | null
  return input ? Number(input.value) : null
}

beforeEach(() => {
  window.localStorage.clear()
  start.mockReset()
  get.mockReset()
  quote.mockReset()
})

afterEach(() => cleanup())

describe('SourcingPage sourcing plan', () => {
  it('sources the cart, applies the plan, and keeps it across a reload', async () => {
    seedCart()
    start.mockResolvedValue(run('running'))
    get.mockResolvedValue(run('done', PLAN))
    const user = userEvent.setup()
    const { unmount } = render(<SourcingPage />)

    await user.click(await screen.findByRole('button', { name: /Source this cart/ }))
    expect(start).toHaveBeenCalledWith({
      lines: [
        { mpn: 'A1', quantity: 10 },
        { mpn: 'B2', quantity: 3 },
        { mpn: 'C3', quantity: 1 },
      ],
    })

    const plan = await screen.findByRole('region', { name: 'Sourcing plan' })
    expect(within(plan).getByText('Ready to buy')).toBeInTheDocument()
    expect(within(plan).getByText(/hits a price break and saves \$1\.25/)).toBeInTheDocument()
    expect(within(plan).getByText(/No source lists this part number/)).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/digi-?key|mouser/i)
    expect(within(plan).getByText('Raises 1 line to the planned quantity.')).toBeInTheDocument()

    await user.click(within(plan).getByRole('button', { name: 'Use B2-ALT' }))
    expect(await within(plan).findByText('Raises 1 line to the planned quantity and swaps in 1 alternate.')).toBeInTheDocument()

    await user.click(within(plan).getByRole('button', { name: 'Apply to cart' }))
    expect(quantityOf('A1')).toBe(25)
    expect(quantityOf('B2')).toBeNull()
    expect(quantityOf('B2-ALT')).toBe(10)
    expect(
      await within(plan).findByText(/Cart updated: 1 line raised to the planned quantity, 1 alternate swapped in/),
    ).toBeInTheDocument()
    expect(within(plan).queryByText(/The cart changed after this plan/)).not.toBeInTheDocument()
    expect(within(plan).getByText('In your cart')).toBeInTheDocument()
    expect(within(cartPanel()).getByText('Plan total')).toBeInTheDocument()

    unmount()
    render(<SourcingPage />)
    const restored = await screen.findByRole('region', { name: 'Sourcing plan' })
    expect(within(restored).getByText('In your cart')).toBeInTheDocument()
    expect(within(restored).getByRole('button', { name: 'Apply to cart' })).toBeDisabled()
    expect(start).toHaveBeenCalledTimes(1)
  })

  it('flags the plan as stale when the cart changes, and blocks applying it', async () => {
    seedCart()
    start.mockResolvedValue(run('running'))
    get.mockResolvedValue(run('done', PLAN))
    const user = userEvent.setup()
    render(<SourcingPage />)
    await user.click(await screen.findByRole('button', { name: /Source this cart/ }))
    const plan = await screen.findByRole('region', { name: 'Sourcing plan' })

    const input = screen.getByLabelText('Quantity of A1')
    await user.clear(input)
    await user.type(input, '12')
    expect(within(plan).getByText(/The cart changed after this plan was made/)).toBeInTheDocument()
    expect(within(plan).getByRole('button', { name: 'Apply to cart' })).toBeDisabled()
    expect(within(cartPanel()).queryByText('Plan total')).not.toBeInTheDocument()
  })

  it('resumes a run that was going when the page reloaded', async () => {
    seedCart()
    window.localStorage.setItem(
      PLAN_STORAGE_KEY,
      JSON.stringify({ runId: 'run-1', run: null, swaps: [], finishedAt: null, savedAt: Date.now() }),
    )
    get.mockResolvedValue(run('done', PLAN))
    render(<SourcingPage />)
    expect(await screen.findByText('Ready to buy')).toBeInTheDocument()
    expect(get).toHaveBeenCalledWith('run-1')
    expect(start).not.toHaveBeenCalled()
  })

  it('falls back to a single-source price when the gateway has no sourcing runs', async () => {
    seedCart()
    start.mockRejectedValue(new SourcingRunError('Not found', 404))
    quote.mockResolvedValue({ status: 'ok', currency: 'USD', subtotal: 3, lines: [] } as never)
    const user = userEvent.setup()
    render(<SourcingPage />)
    await user.click(await screen.findByRole('button', { name: /Source this cart/ }))
    await waitFor(() => expect(quote).toHaveBeenCalledTimes(1))
    expect(await screen.findByText(/priced from one source/)).toBeInTheDocument()
  })

  it('shows the account message when sourcing is refused', async () => {
    seedCart()
    start.mockRejectedValue(
      new SourcingRunError('This account is not enabled yet. We will reach out after we review your registration.', 403),
    )
    const user = userEvent.setup()
    render(<SourcingPage />)
    await user.click(await screen.findByRole('button', { name: /Source this cart/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('This account is not enabled yet.')
    expect(quote).not.toHaveBeenCalled()
  })

  it('will not start a run for an oversized cart', async () => {
    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(Array.from({ length: 201 }, (_, i) => cartLineFrom({ mpn: `PART-${i}` }, 1))),
    )
    render(<SourcingPage />)
    expect(await screen.findByText(/Sourcing takes up to 200 lines at a time. Remove 1 or split the cart./)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Source this cart/ })).toBeDisabled()
  })

  it('clearing the cart drops the plan', async () => {
    seedCart()
    start.mockResolvedValue(run('running'))
    get.mockResolvedValue(run('done', PLAN))
    const user = userEvent.setup()
    render(<SourcingPage />)
    await user.click(await screen.findByRole('button', { name: /Source this cart/ }))
    await screen.findByRole('region', { name: 'Sourcing plan' })
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.queryByRole('region', { name: 'Sourcing plan' })).not.toBeInTheDocument()
    await waitFor(() => expect(window.localStorage.getItem(PLAN_STORAGE_KEY)).toBeNull())
  })

  it('downloads the plan as CSV', async () => {
    seedCart()
    start.mockResolvedValue(run('running'))
    get.mockResolvedValue(run('done', PLAN))
    const blobs: Blob[] = []
    const createObjectURL = vi.fn((blob: Blob) => {
      blobs.push(blob)
      return 'blob:plan'
    })
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() })
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<SourcingPage />)
    await user.click(await screen.findByRole('button', { name: /Source this cart/ }))
    await screen.findByRole('region', { name: 'Sourcing plan' })
    await user.click(screen.getByRole('button', { name: 'CSV' }))
    expect(click).toHaveBeenCalledTimes(1)
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(blobs[0])
    })
    expect(text).toContain('Part number,Manufacturer')
    expect(text).toContain('A1,Acme,Regulator,10,25')
    click.mockRestore()
  })
})
