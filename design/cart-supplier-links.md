# Cart outbound supplier links

## What

Buyers price and plan a cart in Prokuro, then buy on the supplier site. Prokuro does **not** place distributor orders for now.

Each **priced** cart line gets one anonymous link: **Open supplier page**. The label never names Digi-Key or Mouser (`purchaseDisplay.ts`).

## Link rule

Web-only search URL:

`https://www.digikey.com/en/products/result?keywords=` + `encodeURIComponent(matched_mpn || plan buy MPN || cart MPN)`

- Prefer quote `matched_mpn` when the line was priced.
- Else the sourcing-plan buy MPN when a plan is current.
- Else the cart MPN.
- Blank / unpriced lines get **no** link (avoids junk searches).

## Failure modes

- Stale quote: same as today — cart change clears usable price; no link until Source/price again.
- Special characters in MPNs: always `encodeURIComponent`.
- Opening the link leaves Prokuro; we do not track checkout on the supplier site.

## Out of scope

- Digi-Key API `ProductUrl` parse (deferred).
- “Open all” (popup blockers).
- Place order / ship-to / Orders UI (removed from Sourcing).
- Flipping `*_ORDERING_ENABLED`; Digi-Key ShipTo wiring (Mounir).
