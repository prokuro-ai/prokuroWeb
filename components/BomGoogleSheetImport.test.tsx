import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BomGoogleSheetImport from '@/components/BomGoogleSheetImport'
import { SettingsProvider } from '@/components/settings/SettingsContext'
import {
  getGoogleSheetsStatus,
  GoogleSheetsRevokedError,
  importGoogleSheetTab,
  listGoogleSpreadsheets,
  listGoogleTabs,
} from '@/lib/api'

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>()
  return {
    ...actual,
    getGoogleSheetsStatus: vi.fn(),
    listGoogleSpreadsheets: vi.fn(),
    listGoogleTabs: vi.fn(),
    importGoogleSheetTab: vi.fn(),
  }
})

const status = vi.mocked(getGoogleSheetsStatus)
const sheets = vi.mocked(listGoogleSpreadsheets)
const tabs = vi.mocked(listGoogleTabs)
const importing = vi.mocked(importGoogleSheetTab)

const SHEETS = [
  { id: 'ss-1', name: 'AD9574 Evaluation Board BOM', modified_at: '2026-10-24T00:00:00Z' },
  { id: 'ss-2', name: 'Minimal' },
]

const TABS = [
  { title: 'Parts', sheet_id: 0, index: 0 },
  { title: 'Notes', sheet_id: 1, index: 1 },
]

function renderImport({
  canManage = true,
  onFile = vi.fn(),
}: {
  canManage?: boolean
  onFile?: (file: File) => void
} = {}) {
  render(
    <SettingsProvider>
      <BomGoogleSheetImport accountId="acct-1" canManage={canManage} onFile={onFile} />
    </SettingsProvider>,
  )
  return { onFile, user: userEvent.setup() }
}

beforeEach(() => {
  status.mockReset()
  sheets.mockReset()
  tabs.mockReset()
  importing.mockReset()
})

afterEach(() => cleanup())

describe('BomGoogleSheetImport', () => {
  it('shows Connect when Sheets is not connected and the user can manage', async () => {
    status.mockResolvedValue({ connected: false, configured: true })
    renderImport()
    expect(screen.getByText('Checking Google Sheets…')).toBeInTheDocument()
    expect(await screen.findByText('Google Sheets is not connected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
    expect(sheets).not.toHaveBeenCalled()
  })

  it('hides Connect when the user cannot manage the account', async () => {
    status.mockResolvedValue({ connected: false, configured: true })
    renderImport({ canManage: false })
    expect(await screen.findByText('Ask an owner or admin to connect it in Settings.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Connect' })).not.toBeInTheDocument()
  })

  it('filters spreadsheets and does not flash No tabs while they load', async () => {
    status.mockResolvedValue({ connected: true, configured: true })
    sheets.mockResolvedValue(SHEETS)
    let resolveTabs: (value: typeof TABS) => void = () => {}
    tabs.mockReturnValue(
      new Promise((resolve) => {
        resolveTabs = resolve
      }),
    )
    const { user } = renderImport()

    expect(await screen.findByRole('button', { name: /AD9574 Evaluation Board BOM/ })).toBeInTheDocument()
    await user.type(screen.getByLabelText('Find a spreadsheet'), 'minimal')
    expect(screen.queryByRole('button', { name: /AD9574/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Minimal' })).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Find a spreadsheet'))
    await user.click(screen.getByRole('button', { name: /AD9574 Evaluation Board BOM/ }))
    expect(screen.getByText('Loading tabs…')).toBeInTheDocument()
    expect(screen.queryByText('No tabs in that spreadsheet.')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Tab:/ })).not.toBeInTheDocument()

    resolveTabs(TABS)
    expect(await screen.findByRole('button', { name: /^Tab: Parts/ })).toBeInTheDocument()
    expect(screen.queryByText('Loading tabs…')).not.toBeInTheDocument()
    expect(document.querySelector('select')).toBeNull()
  })

  it('imports the selected tab as a CSV file', async () => {
    status.mockResolvedValue({ connected: true, configured: true })
    sheets.mockResolvedValue(SHEETS)
    tabs.mockResolvedValue(TABS)
    importing.mockResolvedValue({ filename: 'AD9574 Evaluation Board BOM.csv', csv: 'MPN,Qty\nC1,1\n' })
    const onFile = vi.fn()
    const { user } = renderImport({ onFile })

    await user.click(await screen.findByRole('button', { name: /AD9574 Evaluation Board BOM/ }))
    expect(await screen.findByRole('button', { name: /^Tab: Parts/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Tab: Parts/ }))
    await user.click(screen.getByRole('menuitemradio', { name: 'Notes' }))
    expect(screen.getByRole('button', { name: /^Tab: Notes/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add this sheet' }))
    await waitFor(() => expect(importing).toHaveBeenCalledWith('acct-1', {
      spreadsheet_id: 'ss-1',
      tab: 'Notes',
      name: 'AD9574 Evaluation Board BOM',
    }))
    expect(onFile).toHaveBeenCalledTimes(1)
    const file = onFile.mock.calls[0][0] as File
    expect(file).toBeInstanceOf(File)
    expect(file.name).toBe('AD9574 Evaluation Board BOM.csv')
    expect(file.type).toBe('text/csv')
  })

  it('shows an empty account and a failed import', async () => {
    status.mockResolvedValue({ connected: true, configured: true })
    sheets.mockResolvedValue([])
    renderImport()
    expect(await screen.findByText('No spreadsheets in that Google account.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Find a spreadsheet')).not.toBeInTheDocument()
  })

  it('shows No spreadsheets match when search hits nothing', async () => {
    status.mockResolvedValue({ connected: true, configured: true })
    sheets.mockResolvedValue(SHEETS)
    const { user } = renderImport()
    await screen.findByRole('button', { name: 'Minimal' })
    await user.type(screen.getByLabelText('Find a spreadsheet'), 'zzz')
    expect(screen.getByText('No spreadsheets match.')).toBeInTheDocument()
  })

  it('shows the import error on the picker', async () => {
    status.mockResolvedValue({ connected: true, configured: true })
    sheets.mockResolvedValue(SHEETS)
    tabs.mockResolvedValue(TABS)
    importing.mockRejectedValue(new Error('that sheet tab is empty'))
    const { user } = renderImport()
    await user.click(await screen.findByRole('button', { name: 'Minimal' }))
    await screen.findByRole('button', { name: /^Tab: Parts/ })
    await user.click(screen.getByRole('button', { name: 'Add this sheet' }))
    expect(await screen.findByText('that sheet tab is empty')).toBeInTheDocument()
  })

  it('treats a revoked list as disconnected', async () => {
    status.mockResolvedValue({ connected: true, configured: true })
    sheets.mockRejectedValue(new GoogleSheetsRevokedError())
    renderImport()
    expect(await screen.findByText('Google access was revoked. Reconnect it in Settings.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect' })).toBeInTheDocument()
  })
})
