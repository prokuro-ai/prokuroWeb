import { describe, expect, it } from 'vitest'
import { supplierLinkKeyword, supplierSearchUrl, SUPPLIER_LINK_LABEL } from '@/lib/supplierLink'

describe('supplierSearchUrl', () => {
  it('returns null for blank or whitespace', () => {
    expect(supplierSearchUrl(null)).toBeNull()
    expect(supplierSearchUrl('')).toBeNull()
    expect(supplierSearchUrl('   ')).toBeNull()
  })

  it('builds an encoded Digi-Key search URL without putting the name in the label constant', () => {
    expect(SUPPLIER_LINK_LABEL).toBe('Open supplier page')
    expect(SUPPLIER_LINK_LABEL.toLowerCase()).not.toMatch(/digi|mouser/)
    expect(supplierSearchUrl(' TPS62840DLCR ')).toBe(
      'https://www.digikey.com/en/products/result?keywords=TPS62840DLCR',
    )
    expect(supplierSearchUrl('A/B#1')).toBe(
      'https://www.digikey.com/en/products/result?keywords=A%2FB%231',
    )
  })
})

describe('supplierLinkKeyword', () => {
  it('prefers matched, then plan buy, then cart (miss/OOS still get cart MPN)', () => {
    expect(
      supplierLinkKeyword({
        cartMpn: 'CART',
        matchedMpn: 'MATCHED',
        planBuyMpn: 'PLAN',
      }),
    ).toBe('MATCHED')
    expect(supplierLinkKeyword({ cartMpn: 'CART', planBuyMpn: 'PLAN' })).toBe('PLAN')
    expect(supplierLinkKeyword({ cartMpn: ' CART ' })).toBe('CART')
    expect(supplierLinkKeyword({ cartMpn: 'MISS-MPN' })).toBe('MISS-MPN')
    expect(supplierLinkKeyword({ cartMpn: '  ', matchedMpn: '  ' })).toBeNull()
  })
})
