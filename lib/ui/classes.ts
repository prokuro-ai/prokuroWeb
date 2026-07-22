/** Shared Tailwind class strings for the authenticated app shell. */

export const card = 'rounded-xl border border-hairline bg-canvas shadow-sm'
export const cardPadded = `${card} p-5`
export const cardPaddedLg = `${card} p-6`

export const btnPrimary =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60'

export const btnPrimarySm =
  'inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60'

export const btnSecondary =
  'inline-flex items-center gap-1.5 rounded-lg border border-hairline bg-canvas px-3.5 py-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:bg-surface-1 hover:text-ink'

export const inputBase =
  'w-full rounded-lg border border-hairline bg-canvas px-3 py-2 text-sm text-ink placeholder:text-ink-tertiary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

export const inputWithIcon =
  'w-full rounded-md border border-hairline bg-surface-1 py-2 pl-9 pr-4 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

export const pageHeader =
  'flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-canvas px-6'

export const alertError = 'rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'

export const dropdownPanel =
  'absolute right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-hairline bg-canvas shadow-lg'

export const linkPrimary = 'font-semibold text-primary transition-colors hover:text-primary-hover'

export const modalOverlay = 'fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4 backdrop-blur-[2px]'
