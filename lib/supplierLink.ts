/** Anonymous buyer CTA — never name Digi-Key or Mouser in the label. */
export const SUPPLIER_LINK_LABEL = 'Open supplier page'

/**
 * Supplier product search URL for a manufacturer / matched part number.
 * Returns null when there is nothing useful to search.
 */
export function supplierSearchUrl(mpn: string | null | undefined): string | null {
  const trimmed = mpn?.trim() ?? ''
  if (!trimmed) return null
  return `https://www.digikey.com/en/products/result?keywords=${encodeURIComponent(trimmed)}`
}

/** Prefer quote match, then plan buy MPN, then the cart line MPN. */
export function supplierLinkKeyword(parts: {
  cartMpn: string
  matchedMpn?: string | null
  planBuyMpn?: string | null
}): string | null {
  const matched = parts.matchedMpn?.trim()
  if (matched) return matched
  const planBuy = parts.planBuyMpn?.trim()
  if (planBuy) return planBuy
  const cart = parts.cartMpn.trim()
  return cart || null
}
