import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import OverviewPage from '@/components/OverviewPage'
import { EMPTY_ACCOUNT_SITUATION, type AnalyzedLine, type BomSummary, type FlaggedLineItem } from '@/lib/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

const boms: BomSummary[] = [
  bom('bom-quiet', 'Quiet Board', 100, 5, 'Watch'),
  bom('bom-clear', 'Clear Board', 40, 0, 'Clear'),
  bom('bom-hot', 'Hot Board', 20, 10, 'Critical'),
]

const items: FlaggedLineItem[] = [
  item('bom-hot', 'Hot Board', line(3, 'LM7805CT', 'red', { lifecycle_status: 'eol' })),
  item('bom-quiet', 'Quiet Board', line(7, 'STM32F103', 'yellow', { availability_status: 'outofstock' })),
]

vi.mock('@/hooks/use-boms', () => ({
  useBoms: () => ({ boms, loading: false, error: null }),
}))

vi.mock('@/hooks/use-flagged-lines', () => ({
  useFlaggedLines: () => ({
    items,
    total: 15,
    situation: { ...EMPTY_ACCOUNT_SITUATION, outOfStock: 4, discontinued: 2, noAlternate: 31 },
    loading: false,
    error: null,
  }),
}))

function bom(id: string, name: string, lineCount: number, atRiskCount: number, riskBand: string): BomSummary {
  return {
    id,
    name,
    filename: `${id}.csv`,
    uploadedAt: '2026-09-01T00:00:00Z',
    version: 1,
    lineCount,
    overallRiskScore: 0,
    atRiskCount,
    unknownCount: 0,
    pendingCount: 0,
    riskBand,
  }
}

function line(
  row_index: number,
  mpn: string,
  risk_level: AnalyzedLine['risk_level'],
  extra: Partial<AnalyzedLine> = {},
): AnalyzedLine {
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

describe('OverviewPage', () => {
  afterEach(() => cleanup())

  it('shows whole-account counts including zeros', () => {
    render(<OverviewPage />)
    const glance = screen.getByRole('region', { name: 'Account at a glance' })
    expect(within(glance).getByText('Need a call').nextSibling?.textContent).toBe('15')
    expect(within(glance).getByText('No alternate on file').nextSibling?.textContent).toBe('31')
    expect(within(glance).getByText('Entity list hit').nextSibling?.textContent).toBe('0')
  })

  it('ranks boards by share at risk and leaves clear boards off', () => {
    render(<OverviewPage />)
    const links = screen.getAllByRole('link').filter((link) => link.getAttribute('href')?.match(/^\/bom\/[^?]+$/))
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/bom/bom-hot', '/bom/bom-quiet'])
    expect(screen.getByText('10 of 20')).toBeTruthy()
    expect(screen.queryByText('Clear Board')).toBeNull()
  })

  it('lists calls with the capped total and groups them by job', async () => {
    render(<OverviewPage />)
    expect(screen.getByText('Showing the worst 2 of 15')).toBeTruthy()
    expect(screen.getByText('LM7805CT', { exact: false })).toBeTruthy()

    await userEvent.setup().click(screen.getByRole('button', { name: 'By job' }))
    expect(screen.getByText('Going obsolete')).toBeTruthy()
    expect(screen.getByText("Can't buy")).toBeTruthy()
  })
})
