import React, { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import EditableBomTable from '@/components/EditableBomTable'
import { BomConflictError, BomServerError, patchBomLine } from '@/lib/api'
import type { AnalyzedLine } from '@/lib/types'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    patchBomLine: vi.fn(),
    deleteBomLine: vi.fn(),
    addBomLine: vi.fn(),
  }
})

const sampleLine: AnalyzedLine = {
  row_index: 0,
  mpn: 'ORIG-MPN',
  manufacturer: 'Acme',
  quantity: 1,
  refdes: 'U1',
  description: 'chip',
  aml_candidates: [],
  availability_status: 'instock',
  lifecycle_status: 'active',
  match_status: 'exact',
  factory_lead_days: null,
  total_avail: 100,
  risk_level: 'green',
}

function renderTable(onConflict = vi.fn()) {
  return render(
    <EditableBomTable
      bomId="bom-1"
      version={1}
      lines={[sampleLine]}
      onLinesChange={vi.fn()}
      onVersionChange={vi.fn()}
      onConflict={onConflict}
    />,
  )
}

/** Mirrors BomResultPage conflict banner wiring around EditableBomTable. */
function ConflictBannerHarness({ onConflict }: { onConflict: () => void }) {
  const [conflict, setConflict] = useState(false)
  return (
    <>
      {conflict && (
        <div role="alert">
          This BOM was updated elsewhere.{' '}
          <button type="button">Refresh to see the latest</button>
        </div>
      )}
      <EditableBomTable
        bomId="bom-1"
        version={1}
        lines={[sampleLine]}
        onLinesChange={vi.fn()}
        onVersionChange={vi.fn()}
        onConflict={() => {
          onConflict()
          setConflict(true)
        }}
      />
    </>
  )
}

async function editMpnAndSubmit(user: ReturnType<typeof userEvent.setup>, next: string) {
  await user.click(screen.getByRole('button', { name: 'ORIG-MPN' }))
  const input = screen.getByDisplayValue('ORIG-MPN')
  await user.clear(input)
  await user.type(input, next)
  // fireEvent avoids a blur-driven second commit while the first save is in flight.
  fireEvent.keyDown(input, { key: 'Enter' })
}

describe('EditableBomTable save failure handling', () => {
  beforeEach(() => {
    vi.mocked(patchBomLine).mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('keeps the typed draft when save fails (does not revert to original)', async () => {
    const user = userEvent.setup()
    vi.mocked(patchBomLine).mockRejectedValue(new BomServerError())

    renderTable()
    await editMpnAndSubmit(user, 'TYPED-DRAFT')

    await waitFor(() => {
      expect(
        screen.getAllByText('Your change could not be saved, please try again').length,
      ).toBeGreaterThan(0)
    })
    expect(screen.getByDisplayValue('TYPED-DRAFT')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('ORIG-MPN')).not.toBeInTheDocument()
  })

  it('shows conflict banner with refresh messaging on 409', async () => {
    const user = userEvent.setup()
    const onConflict = vi.fn()
    vi.mocked(patchBomLine).mockRejectedValue(
      new BomConflictError('this BOM was updated elsewhere, refresh to see the latest'),
    )

    render(<ConflictBannerHarness onConflict={onConflict} />)
    await editMpnAndSubmit(user, 'CONFLICT-MPN')

    await waitFor(() => {
      expect(onConflict).toHaveBeenCalled()
      expect(screen.getByRole('button', { name: 'Refresh to see the latest' })).toBeInTheDocument()
    })
    expect(screen.getByRole('alert')).toHaveTextContent('This BOM was updated elsewhere')
  })

  it('shows save error copy and Retry after a 500', async () => {
    const user = userEvent.setup()
    vi.mocked(patchBomLine).mockRejectedValue(new BomServerError())

    renderTable()
    await editMpnAndSubmit(user, 'SERVER-FAIL')

    await waitFor(() => {
      expect(
        screen.getAllByText('Your change could not be saved, please try again').length,
      ).toBeGreaterThan(0)
    })
    const retry = screen.getAllByRole('button', { name: 'Retry' })
    expect(retry.length).toBeGreaterThan(0)
    expect(retry[0]).toBeVisible()
  })

  it('Retry resubmits the preserved draft value', async () => {
    const user = userEvent.setup()
    vi.mocked(patchBomLine).mockRejectedValue(new BomServerError())

    renderTable()
    await editMpnAndSubmit(user, 'RETRY-DRAFT')

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Retry' }).length).toBeGreaterThan(0)
    })

    vi.mocked(patchBomLine).mockResolvedValueOnce({
      version: 2,
      lineIndex: 0,
      line: { ...sampleLine, mpn: 'RETRY-DRAFT' },
    })

    await user.click(screen.getAllByRole('button', { name: 'Retry' })[0]!)

    await waitFor(() => {
      expect(patchBomLine).toHaveBeenCalled()
      const last = vi.mocked(patchBomLine).mock.calls.at(-1)
      expect(last?.[2]).toMatchObject({
        version: 1,
        mpn: 'RETRY-DRAFT',
      })
    })
  })
})
