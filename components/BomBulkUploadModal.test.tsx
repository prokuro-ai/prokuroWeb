import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BomBulkUploadModal from '@/components/BomBulkUploadModal'
import { SettingsProvider } from '@/components/settings/SettingsContext'
import { getGoogleSheetsStatus } from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    getGoogleSheetsStatus: vi.fn(),
    listGoogleSpreadsheets: vi.fn(),
    listGoogleTabs: vi.fn(),
    importGoogleSheetTab: vi.fn(),
    parseFile: vi.fn(),
    analyzeFile: vi.fn(),
    saveBom: vi.fn(),
  }
})

const status = vi.mocked(getGoogleSheetsStatus)

beforeEach(() => {
  status.mockReset()
  status.mockResolvedValue({ connected: false, configured: true })
})

afterEach(() => cleanup())

describe('BomBulkUploadModal Sheets tab', () => {
  it('switches copy from file drop to picking a spreadsheet', async () => {
    const user = userEvent.setup()
    render(
      <SettingsProvider>
        <BomBulkUploadModal open onClose={() => {}} onComplete={() => {}} accountId="acct-1" canManage />
      </SettingsProvider>,
    )
    expect(screen.getByText(/Drop a CSV or Excel export/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Google Sheet' }))
    expect(screen.getByText(/Pick a spreadsheet and tab/)).toBeInTheDocument()
    expect(await screen.findByText('Google Sheets is not connected')).toBeInTheDocument()
    expect(screen.queryByText(/Drop files here/)).not.toBeInTheDocument()
  })
})
