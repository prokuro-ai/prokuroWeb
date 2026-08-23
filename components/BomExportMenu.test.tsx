import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest'
import BomExportMenu from '@/components/BomExportMenu'
import type { AnalyzeResult } from '@/lib/types'

const exportMocks = vi.hoisted(() => ({
  csv: vi.fn(),
  excel: vi.fn(),
  json: vi.fn(),
}))

vi.mock('@/lib/export', () => ({
  exportAnalyzeResultCsv: exportMocks.csv,
  exportAnalyzeResultExcel: exportMocks.excel,
  exportAnalyzeResultJson: exportMocks.json,
}))

const sampleResult: AnalyzeResult = {
  upload_id: 'upload-1',
  source_filename: 'board.csv',
  sheet_name: null,
  mapping_confidence: 1,
  summary: {
    total: 0,
    in_stock: 0,
    out_of_stock: 0,
    eol_or_nrnd: 0,
    no_match: 0,
    long_lead: 0,
  },
  lines: [],
  warnings: [],
  stats: {},
  analyzed_at: '2026-08-23T00:00:00.000Z',
}

describe('BomExportMenu', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    exportMocks.csv.mockReset()
    exportMocks.excel.mockReset()
    exportMocks.json.mockReset()
  })

  it('calls the CSV exporter when Download CSV is selected', async () => {
    const user = userEvent.setup()
    render(<BomExportMenu result={sampleResult} />)

    await user.click(screen.getByRole('button', { name: /export/i }))
    await user.click(screen.getByRole('menuitem', { name: /download csv/i }))

    expect(exportMocks.csv).toHaveBeenCalledWith(sampleResult)
  })

  it('calls the Excel exporter when Download Excel is selected', async () => {
    const user = userEvent.setup()
    render(<BomExportMenu result={sampleResult} />)

    await user.click(screen.getByRole('button', { name: /export/i }))
    await user.click(screen.getByRole('menuitem', { name: /download excel/i }))

    expect(exportMocks.excel).toHaveBeenCalledWith(sampleResult)
  })
})
