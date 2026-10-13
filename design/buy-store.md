# Sourcing page (was Buy)

**Status:** PR 1 and PR 2 shipped. Renamed to Sourcing, with distributors abstracted.

## Update: Sourcing, distributors abstracted

The tab is called **Sourcing** and lives at `/sourcing`; `/purchasing` redirects there. A buyer wants the right part at the lowest price. Which distributor fills the line is Prokuro's job, not theirs. So the UI never names Digi-Key or Mouser and has no distributor switch.

- **Web (done):** every call goes to `SOURCING_PROVIDER` in `lib/purchaseDisplay.ts`. Status text is distributor-neutral. Gateway messages are shown only for plan limits, because the others can name the distributor.
- **Backend (next):** the quote endpoint should price each line at every configured distributor and return the cheapest in-stock offer per line, with the distributor kept internal. Then `provider` becomes optional in `QuoteRequest` and the web constant goes away. Orders would then split per distributor server-side.

## Original design (Buy)
**Repos touched:** `prokuroWeb` (PR 1). `prokuroBackend` gateway (PR 2, companion suggestions).

## Problem

`/purchasing` is a blank form. A buyer retypes part numbers that are already sitting in their BOMs, gets one quote table back, and has nowhere to keep a running list. It reads like an internal test harness, not somewhere you shop.

## What it does

The page becomes a store with three areas.

**Catalog: parts from your boards.** We load the team's most recent boards (`GET /v1/boms`, then `GET /v1/boms/{id}`, capped at 12) and list every MPN-bearing line, deduplicated across boards. Each row shows the part, manufacturer, which boards use it and how many, stock, lifecycle and risk, plus an Add control. There is a board filter, a text search, and "Add board" with a build quantity, which adds every line × builds.

**Part lookup.** For a part that isn't on a board, type an MPN and look it up. This prices one unit at the selected distributor through the existing `POST /v1/purchase/quote`, so it counts as one purchasing action. Say that next to the button.

**Cart.** This is a sticky side panel, persisted in `localStorage` per browser. It holds lines with quantity steppers and remove, a Digi-Key/Mouser switch, and "Price cart", which uses the existing quote call. Unit and extended prices show inline, with a subtotal. "Place order" keeps today's behavior. Ordering flags stay off server-side, so it returns `not_configured`/`requires_distributor_credit`, and we show that plainly. Any cart edit marks the last price as stale.

**Worth adding (suggestions).** PR 1 computes these client-side from data we already have:

1. **Swap an at-risk part.** The cart holds a Critical or Watch part, and its BOM line has an alternate. That alternate comes from the Bedrock line brief (`brief.alternate`) or the customer's own AML column (`aml_candidates`). We offer "Add alternate" with the brief's reason.
2. **Finish the board.** Some of a board's lines are in the cart but not all of them. We offer "Add the N missing parts", at the quantity ratio of what's already there.
3. **Attrition on passives.** Resistors, capacitors, inductors and ferrites (by refdes prefix or category) get a pick-and-place loss allowance. We suggest topping each up by 10%, minimum +10 pieces. This is the usual EMS allowance; it's a rule, not AI, and the UI says so.

Each suggestion names its source ("Line brief", "Your AML", "Board", "Attrition rule"), so nothing pretends to be smarter than it is.

PR 2 adds `POST /v1/purchase/suggestions` in the gateway. It sends the cart (MPN, manufacturer, description, qty) to the existing Bedrock client (Nova Micro) and asks for companion parts the build needs, such as decoupling caps for a regulator, a crystal for an MCU, or connectors. The model returns JSON. Every suggested MPN is then priced through the purchasing provider before we show it. Anything the distributor doesn't recognize gets dropped, so a hallucinated part number never reaches the cart.

## Fit with current architecture

PR 1 needs no backend change. Everything goes through the existing Amplify `/api/*` proxies. Quote caps and the read-only seat check (`useTeam().canWrite`) apply as before. PR 2 reuses `state.bedrock` and the purchasing client the gateway already holds.

## Failure modes

- **Board loads fail one by one.** Show the boards that loaded, plus a line saying how many didn't.
- **No boards.** The catalog shows an empty state that points to `/bom/new`; lookup and cart still work.
- **Quote errors or the cap is hit.** The cart keeps its contents and shows the status message from the existing `statusLabel`.
- **Pending lines.** They're still addable, but show "Checking", not a stock number.
- **Stale `localStorage` cart from an older shape.** Discard it if it doesn't parse.
- **PR 2: Bedrock disabled (`BEDROCK_MODEL_ID` unset) or erroring.** The endpoint returns an empty list and the panel shows the PR 1 suggestions only.

## Out of scope

Keyword or parametric search (the distributor quote APIs take exact MPNs), multi-distributor split carts, and saving carts server-side to share across the team.

## Testing

Unit tests cover the cart and suggestion logic in `lib/cart.ts`. Then deploy and verify on Amplify with a `@prokuro.ai` login. Steps:

1. Add a board.
2. Price the cart at Digi-Key.
3. Accept each suggestion type.
4. Look up an off-BOM MPN.
5. Confirm Place order reports the distributor isn't connected.
