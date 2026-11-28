# Purchase pipeline — order confirmation + shipping (web)

Companion to `prokuroBackend/design/purchase-pipeline-shipping.md`.

**Status:** buy-through-us UI is **parked**. Current Sourcing path is outbound supplier links — see `design/cart-supplier-links.md`. Backend order store / place-order APIs remain dormant; ordering flags stay false.

## Parked UI (not shown)

Place order, ship-to on cart, confirmation panel, Orders list.

## Constraints

Do not name Digi-Key/Mouser in buyer copy (`purchaseDisplay.ts`). Keep `/sourcing` as the surface.
