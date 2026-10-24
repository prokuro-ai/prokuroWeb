import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import PartsCatalog from '@/components/sourcing/PartsCatalog'
import { buildCatalog, type Board } from '@/lib/cart'
import type { AnalyzedLine } from '@/lib/types'

function line(overrides: Partial<AnalyzedLine>): AnalyzedLine {
  return {
    row_index: 0,
    mpn: 'LM7805CT',
    manufacturer: 'Texas Instruments',
    quantity: 1,
    refdes: 'U1',
    description: 'Linear regulator',
    aml_candidates: [],
    availability_status: 'InStock',
    lifecycle_status: 'Active',
    match_status: 'Exact',
    factory_lead_days: 42,
    total_avail: 5000,
    risk_level: 'green',
    ...overrides,
  }
}

const BOARDS: Board[] = [
  {
    id: 'b1',
    name: 'Controller',
    lines: [
      line({ row_index: 0, mpn: 'LM7805CT', quantity: 2 }),
      line({ row_index: 1, mpn: 'GRM155R61A104KA01D', refdes: 'C1', quantity: 3 }),
    ],
  },
  { id: 'b2', name: 'Sensor', lines: [line({ row_index: 0, mpn: 'BME280', quantity: 1 })] },
]

function setup() {
  const onAdd = vi.fn()
  render(
    <PartsCatalog boards={BOARDS} catalog={buildCatalog(BOARDS)} cart={[]} loading={false} error={null} failed={0} onAdd={onAdd} />,
  )
  return { onAdd, user: userEvent.setup() }
}

afterEach(() => cleanup())

describe('PartsCatalog', () => {
  it('has no native number spinners or select', () => {
    setup()
    expect(document.querySelector('input[type="number"]')).toBeNull()
    expect(document.querySelector('select')).toBeNull()
  })

  it('steps a quantity with the + and − buttons and adds that many', async () => {
    const { onAdd, user } = setup()
    const input = screen.getByLabelText('Quantity of LM7805CT') as HTMLInputElement
    expect(input.value).toBe('2')
    await user.click(screen.getByRole('button', { name: 'Increase quantity of LM7805CT' }))
    await user.click(screen.getByRole('button', { name: 'Increase quantity of LM7805CT' }))
    expect(input.value).toBe('4')
    await user.click(screen.getByRole('button', { name: 'Decrease quantity of LM7805CT' }))
    expect(input.value).toBe('3')

    const row = input.closest('tr') as HTMLElement
    await user.click(within(row).getByRole('button', { name: 'Add' }))
    expect(onAdd).toHaveBeenCalledWith([expect.objectContaining({ mpn: 'LM7805CT', quantity: 3 })])
  })

  it('never steps below 1 and ignores non-digits', async () => {
    const { user } = setup()
    const input = screen.getByLabelText('Quantity of BME280') as HTMLInputElement
    const down = screen.getByRole('button', { name: 'Decrease quantity of BME280' })
    expect(down).toBeDisabled()
    await user.clear(input)
    await user.type(input, '4x2')
    expect(input.value).toBe('42')
    await user.keyboard('{ArrowUp}')
    expect(input.value).toBe('43')
  })

  it('filters to one board from the board menu', async () => {
    const { user } = setup()
    expect(screen.getByLabelText('Quantity of BME280')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Board: All boards/ }))
    await user.click(screen.getByRole('menuitemradio', { name: /Controller/ }))
    expect(screen.queryByLabelText('Quantity of BME280')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Quantity of LM7805CT')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Board: Controller/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add whole board' })).toBeInTheDocument()
  })
})
