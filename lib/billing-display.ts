export function formatPeriodEnd(value: string | null | undefined) {
  if (!value) return null
  const asNumber = Number(value)
  const date = Number.isFinite(asNumber) && value.trim() !== ''
    ? new Date(asNumber * 1000)
    : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
