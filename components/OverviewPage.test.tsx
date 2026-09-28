import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import OverviewPage from '@/components/OverviewPage'
import type { AnalyzedLine, BoardTally, FlaggedLineItem, FlaggedLines, LineTally } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

function tally(mix: Partial<LineTally['mix']>, situation: Partial<LineTally['situation']> = {}): LineTally {
  return {
    mix: { red: 0, yellow: 0, green: 0, noMatch: 0, pending: 0, ...mix },
    situation: {
      outOfStock: 0,
      longLead: 0,
      nrnd: 0,
      discontinued: 0,
      noAlternate: 0,
      duty: 0,
      entityList: 0,
      ...situation,
    },
    lead: { upTo4Weeks: 3, upTo12Weeks: 2, upTo26Weeks: 0, upTo52Weeks: 1, over52Weeks: 0, unpublished: 0 },
  }
}

function board(bomId: string, bomName: string, t: LineTally): BoardTally {
  return { bomId, bomName, ...t }
}

function line(row_index: number, mpn: string, risk_level: AnalyzedLine['risk_level'], extra: Partial<AnalyzedLine> = {}): AnalyzedLine {
  return {
    row_index,
    mpn,
    manufacturer: 'Acme',
    quantity: 1,
    refdes: 'U1',
    description: null,
    aml_candidates: [],
    availability_status: 'instock',
    lifecycle_status: 'active',
    match_status: 'exact',
    factory_lead_days: 14,
    total_avail: 100,
    risk_level,
    ...extra,
  }
}

function item(bomId: string, bomName: string, analyzed: AnalyzedLine): FlaggedLineItem {
  return { bomId, bomName, bomVersion: 1, line: analyzed }
}

const feed: FlaggedLines = {
  accountId: 'account-a',
  total: 15,
  account: tally({ red: 4, yellow: 11, green: 140, pending: 5 }, { outOfStock: 4, discontinued: 2, noAlternate: 31 }),
  boards: [
    board('bom-quiet', 'Quiet Board', tally({ yellow: 5, green: 95 })),
    board('bom-clear', 'Clear Board', tally({ green: 40 })),
    board('bom-hot', 'Hot Board', tally({ red: 4, yellow: 6, green: 5, pending: 5 }, { outOfStock: 4 })),
  ],
  items: [
    item('bom-hot', 'Hot Board', line(3, 'LM7805CT', 'red', { lifecycle_status: 'eol' })),
    item('bom-quiet', 'Quiet Board', line(7, 'STM32F103', 'yellow', { availability_status: 'outofstock' })),
  ],
}

vi.mock('@/hooks/use-flagged-lines', () => ({
  useFlaggedLines: () => ({ feed, loading: false, error: null }),
}))

describe('OverviewPage', () => {
  afterEach(() => cleanup())

  it('summarises every part, not just the capped calls', () => {
    render(<OverviewPage />)
    expect(screen.getByText('3 BOMs · 160 parts · 5 still looking up')).toBeTruthy()
    const account = screen.getByRole('region', { name: 'Account' })
    expect(within(account).getByText('15')).toBeTruthy()
    expect(within(account).getByText('parts need a call')).toBeTruthy()
    expect(within(account).getByText('9% of 160')).toBeTruthy()
  })

  it('shows whole-account exceptions against scored parts, zeros included', () => {
    render(<OverviewPage />)
    const account = screen.getByRole('region', { name: 'Account' })
    const noAlt = within(account).getByText('No alternate on file').closest('li')!
    expect(within(noAlt).getByText('31')).toBeTruthy()
    expect(noAlt.getAttribute('title')).toBe('20% of 155 scored parts')
    const entity = within(account).getByText('Entity list hit').closest('li')!
    expect(within(entity).getByText('0')).toBeTruthy()
  })

  it('ranks boards by share of parts needing a call, clear boards last', () => {
    render(<OverviewPage />)
    const boards = screen.getByRole('region', { name: 'Boards' })
    const names = within(boards)
      .getAllByRole('link')
      .map((link) => link.textContent)
    expect(names).toEqual(['Hot Board', 'Quiet Board', 'Clear Board'])
  })

  it('lists calls with the capped total and groups them by job', async () => {
    render(<OverviewPage />)
    const calls = screen.getByRole('region', { name: 'Calls this week' })
    expect(within(calls).getByText('2 of 15')).toBeTruthy()
    expect(within(calls).getByText('LM7805CT')).toBeTruthy()

    await userEvent.setup().click(within(calls).getByRole('button', { name: 'By job' }))
    expect(within(calls).getByText('Going obsolete')).toBeTruthy()
    expect(within(calls).getByText("Can't buy")).toBeTruthy()
  })
})
