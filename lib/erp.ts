/** ERP import presets: file-based export paths only. No live API connections. */

export type ErpId =
  | 'sap'
  | 'netsuite'
  | 'dynamics'
  | 'epicor'
  | 'quickbooks'
  | 'other'

export type ErpPreset = {
  id: ErpId
  label: string
  shortLabel: string
  blurb: string
  exportSteps: string[]
}

export const ERP_PRESETS: ErpPreset[] = [
  {
    id: 'sap',
    label: 'SAP',
    shortLabel: 'SAP',
    blurb: 'S/4HANA, ECC (CS11 / CS12 / CS13), or Business One BOM exports.',
    exportSteps: [
      'Open the BOM (CS11, CS12, or CS13 in ECC / S/4HANA, or the BOM screen in Business One).',
      'Export or download as CSV or Excel. Keep the header row.',
      'If the file has a title block above the table, leave it. We skip those rows.',
      'Upload the file here. We look for Component / Material and Comp. Qty.',
    ],
  },
  {
    id: 'netsuite',
    label: 'Oracle NetSuite',
    shortLabel: 'NetSuite',
    blurb: 'Assembly BOM or work-order component exports.',
    exportSteps: [
      'Open the assembly or BOM record in NetSuite.',
      'Export the member / component list to CSV or Excel.',
      'Keep columns such as Member Item and Quantity.',
      'Upload the file here. We map Member Item to part number.',
    ],
  },
  {
    id: 'dynamics',
    label: 'Microsoft Dynamics 365',
    shortLabel: 'Dynamics',
    blurb: 'Business Central production BOM or component exports.',
    exportSteps: [
      'Open the production BOM or assembly BOM in Business Central.',
      'Export the component lines to CSV or Excel (semicolon CSV is fine).',
      'Keep Component or Vendor Item No. and Quantity.',
      'Upload the file here.',
    ],
  },
  {
    id: 'epicor',
    label: 'Epicor',
    shortLabel: 'Epicor',
    blurb: 'Kinetic / ERP part method or job BOM exports.',
    exportSteps: [
      'Open the part method or job BOM in Epicor.',
      'Export materials to CSV or Excel.',
      'Keep Part Num and Qty Per when you can.',
      'Upload the file here.',
    ],
  },
  {
    id: 'quickbooks',
    label: 'QuickBooks / Fishbowl / Katana',
    shortLabel: 'QB / Fishbowl',
    blurb: 'Small-shop inventory BOMs from QuickBooks, Fishbowl, or Katana.',
    exportSteps: [
      'Open the assembly or product BOM in your tool.',
      'Export components to CSV or Excel.',
      'Keep Item / SKU and Quantity columns.',
      'Upload the file here.',
    ],
  },
  {
    id: 'other',
    label: 'Spreadsheet / other',
    shortLabel: 'Other',
    blurb: 'Any CSV or Excel BOM. We use the same auto-mapping as a normal upload.',
    exportSteps: [
      'Export your BOM as CSV or Excel with a header row.',
      'Include a part number column. Manufacturer and quantity help when present.',
      'Upload the file. You can fix any column mapping before we analyze.',
    ],
  },
]

export function erpPreset(id: string | null | undefined): ErpPreset {
  return ERP_PRESETS.find((preset) => preset.id === id) ?? ERP_PRESETS[ERP_PRESETS.length - 1]
}

export function erpLabel(id: string | null | undefined): string {
  return erpPreset(id).label
}

export type ErpPrefs = {
  default_erp: ErpId | null
  howto_collapsed: boolean
  onboarding_skipped: boolean
  mappings: SavedErpMapping[]
  live_sync_requests: LiveSyncInterest[]
}

export type SavedErpMapping = {
  erp: ErpId | string
  column_mapping: Record<string, string>
  updated_at: string
}

export type LiveSyncInterest = {
  erp: ErpId | string
  requested_at: string
  requested_by: string
  email?: string | null
}

export const EMPTY_ERP_PREFS: ErpPrefs = {
  default_erp: null,
  howto_collapsed: false,
  onboarding_skipped: false,
  mappings: [],
  live_sync_requests: [],
}
