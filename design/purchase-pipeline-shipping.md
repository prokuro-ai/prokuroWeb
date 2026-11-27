# Purchase pipeline — order confirmation + shipping (web)

Companion to `prokuroBackend/design/purchase-pipeline-shipping.md`.

## UI

**Before Place order:** cart shows need-by (from BOM when known) and lead days from last quote; ship-to fields (name, lines, city, region, postal, country).

**After Place order:** confirmation panel (not only a toast) with every line’s MPN, qty, unit/ext, lead, need-by, PO, ship-to, status. If `requires_distributor_credit` / `not_configured`, say ordering isn’t connected — never show fake tracking.

**Later:** Orders list + per-order tracking when distributor status exists.

## Constraints

Do not name Digi-Key/Mouser in buyer copy (`purchaseDisplay.ts`). Keep `/sourcing` as the surface.
