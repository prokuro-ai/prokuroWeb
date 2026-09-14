import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import BomPartsTable from '@/components/BomPartsTable'
import type { AnalyzedLine } from '@/lib/types'

const base: AnalyzedLine = {
  row_index: 0,
  mpn: 'CRCW040210K0FKED',
  manufacturer: 'Vishay',
  quantity: 10,
  refdes: 'R1',
  description: 'Resistor',
  aml_candidates: [],
  availability_status: 'InStock',
  lifecycle_status: 'Active',
  match_status: 'Exact',
  factory_lead_days: 42,
  total_avail: 11000000,
  risk_level: 'green',
}

const pending: AnalyzedLine = {
  ...base,
  row_index: 1,
  mpn: 'PENDING-PART',
  risk_level: 'unknown',
  availability_status: 'Pending',
  match_status: 'Pending',
  total_avail: 0,
  factory_lead_days: null,
}

const noMatch: AnalyzedLine = {
  ...base,
  row_index: 2,
  mpn: 'NOMATCH-PART',
  risk_level: 'unknown',
  availability_status: 'NoMatch',
  match_status: 'none',
  total_avail: 0,
  factory_lead_days: null,
}

function filterNav() {
  return screen.getByRole('navigation', { name: 'Filter parts' })
}

afterEach(cleanup)

describe('BomPartsTable unresolved lines', () => {
  it('shows Checking on a pending row and Unmatched on a resolved miss', () => {
    render(<BomPartsTable lines={[base, pending, noMatch]} />)
    const rows = within(screen.getByRole('table')).getAllByRole('row')

    const pendingRow = rows.find((row) => within(row).queryByText('PENDING-PART'))
    const noMatchRow = rows.find((row) => within(row).queryByText('NOMATCH-PART'))

    expect(within(pendingRow!).getByText('Checking')).toBeTruthy()
    expect(within(pendingRow!).queryByText('Unmatched')).toBeNull()
    expect(within(noMatchRow!).getByText('Unmatched')).toBeTruthy()
  })

  it('counts pending lines separately from the Unmatched bucket', () => {
    render(<BomPartsTable lines={[base, pending, noMatch]} />)
    const nav = filterNav()

    expect(within(nav).getByRole('button', { name: /^Unmatched/ }).textContent).toContain('1')
    expect(within(nav).getByRole('button', { name: /^Checking/ }).textContent).toContain('1')
  })

  it('filters down to only the pending lines', async () => {
    const user = userEvent.setup()
    render(<BomPartsTable lines={[base, pending, noMatch]} />)

    await user.click(within(filterNav()).getByRole('button', { name: /^Checking/ }))

    const table = screen.getByRole('table')
    expect(within(table).getByText('PENDING-PART')).toBeTruthy()
    expect(within(table).queryByText('NOMATCH-PART')).toBeNull()
    expect(within(table).queryByText('CRCW040210K0FKED')).toBeNull()
  })

  it('hides the Checking filter when nothing is pending', () => {
    render(<BomPartsTable lines={[base, noMatch]} />)
    expect(within(filterNav()).queryByRole('button', { name: /^Checking/ })).toBeNull()
  })
})
