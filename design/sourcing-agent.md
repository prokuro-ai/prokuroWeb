# Sourcing agent

**Status:** built and verified locally against live Digi-Key. Not yet on a deployed stack. Backend `feat/purchasing-offers` → `feat/sourcing-agent` (stacked), web `feat/sourcing-agent`.

## What it does

The buyer presses **Source this cart**. Prokuro works out how to buy every line for the least money and comes back with a plan the buyer approves. They never pick a distributor, a packaging type, or a price break.

For each line the agent:

1. Prices the part at every configured distributor and every packaging option: cut tape, full reel, and Digi-Reel with its fee.
2. Respects the minimum order and order multiple, so the price shown is what you would actually pay.
3. Buys up to the next price break when that costs less in total. Example: 100 pcs for $0.75 instead of 90 pcs for $0.81. The spares come free.
4. Splits a line across two sources when no single source has enough stock.
5. When a line is short or not found, prices the buyer's AML alternates and the alternate from the line brief, then proposes the best one. The buyer has to accept a swap; it is never automatic.
6. Checks AML alternates on the highest-spend lines and proposes a swap when one saves at least 10%. AML parts are already approved, so these are safe proposals.

The plan shows the total, what each line costs, why the agent chose it, and what needs the buyer. **Apply to cart** writes the bought quantities and accepted swaps back into the cart.

### Line outcomes

| Status | Meaning | What the buyer is told |
|---|---|---|
| Ready | Fully covered. | Price-break, minimum-order, split, and lead-time notes. |
| Short | Partly covered; the plan buys what exists. | How many are missing. |
| Out of stock | Listed, nothing on hand. | Lead time; the alternate if one exists. |
| No price | Listed, but no source publishes a price. Usually obsolete or discontinued. | Needs a quote request. |
| Not found | A clean miss from every source. | Check for typos or a missing packaging suffix. |
| Needs detail | The number matches several different parts. | Add the full part number. |
| Not checked | A source errored or rate-limited. Never written as not found. | Run again in a minute. |
| Not a part number | Failed the safe-MPN check, so it was never sent to a distributor. | Nothing was looked up. |

Lifecycle notes come from the manufacturer status: not for new designs, last-time buy, obsolete, no longer carried. When a short number like `BLM18KG260TN1` is listed only with a suffix (`…TN1D`), the agent uses the single suffixed listing and says "Listed as …". Several suffixed listings make the line "Needs detail" instead of a guess.

No distributor is ever named in the UI or the CSV. Notes say "sources".

## Why a background run

The browser reaches the gateway only through Amplify `/api/*`, which cuts off at about 30 s. Pricing 100 lines at two distributors takes longer than that. So:

- `POST /v1/sourcing/runs` validates the input, reserves **one** purchasing action, starts the run in the background, and returns `{id, status: running, stage, progress}`.
- `GET /v1/sourcing/runs/{id}` returns progress, then the finished plan. The page polls every 1.5 s.
- Progress counts are real: parts priced so far, then alternates checked.

One run uses one purchasing action no matter how many lines it has. That matters on Free, which allows 5 a month. If no distributor answered at all, the action is released.

## Services and repos

| Repo | Change |
|---|---|
| prokuroBackend / purchasing | Quote lines also return `offers` (one per packaging option, with price breaks, minimum order, multiple, stock and fee), `error_kind`, manufacturer, description and lead time. The old single-price fields now use the cheapest valid packaging option. That fixes reel pricing on small quantities and orders placed against a reel part number. Mouser numeric fields parse whether they arrive as numbers or strings. |
| prokuroBackend / gateway | `sourcing.rs`: pure planner plus the run store and handlers. Runs live in memory, one active run per user, expire after 30 min, and the store is capped. |
| prokuroWeb | `hooks/use-sourcing-run.ts` (start, poll, resume, backoff), `components/sourcing/SourcingPlan.tsx` (progress stepper, summary tiles, coverage bar, filters, plan table, swap accept, apply, CSV), `lib/sourcingPlan.ts` (pure logic: request building, staleness, apply, CSV, normalising untrusted plans). The cart's **Source this cart** replaces **Get best price**, and each cart line shows its planned status and price. |
| prokuroInfrastructureCDK | None. |

## Failure modes

- **Distributor rate limit or outage:** the line is marked "Couldn't check right now", never "not found". The planner works with whatever answered.
- **Mouser not configured** (true today: there is no key in `.env` or Secrets Manager): it runs on Digi-Key alone. The UI never mentions this.
- **Gateway restart mid-run:** the poll gets 404, and the page says the run was interrupted and offers to run again. The action was already spent; that is acceptable at this volume.
- **More than one Fargate task:** a poll can land on a task that doesn't know the run. Today `desiredCount` is 1. Before scaling out, move runs to Dynamo or turn on ALB stickiness.
- **Older gateway without the endpoint:** POST returns 404, and the page falls back to the single-source quote with the same UI.
- **Cart edited while a run is going, or after the plan:** staleness is checked against the plan's content, not a saved signature. A line matches at the quantity that was sourced, at the quantity the plan buys (after Apply), or swapped for its alternate. Anything else shows "The cart changed after this plan was made", disables Apply, and drops the plan prices from the cart.
- **Second tab, or a double click:** the gateway answers 409 with the running `run_id`. The page follows that run and says it picked up a run already going. If it was for another cart, the stale check above catches it.
- **Reload mid-run:** the run id is saved in localStorage and resumed on load. It is dropped after 30 minutes, the gateway's retention. A finished plan and its accepted swaps are kept for 7 days.
- **Flaky network while polling:** retries with backoff (3 s, 6 s, 12 s, 24 s). After five failures the page says it lost the connection and offers **Check again**; the run keeps going server-side. The client gives up after 4 minutes of `running`.
- **Account blocked by billing:** the start returns the standard 403 `not_provisioned` or 402 `plan_cap_exceeded` body, and the page shows that message. The run slot is released.
- **Malformed or newer-version plan:** the web normalises every plan from the network or storage. Unknown statuses read as "Not checked", unknown notes are dropped, counts are recomputed, and non-finite prices become 0. A newer gateway can't crash the page.
- **Input that trips the distributor firewall** (`<script>`, `../`): rejected by `safe_part_number` in the gateway and purchasing before any request. HTML error bodies are summarised, never shown raw.
- **CSV export:** cells that start with `= + - @` are prefixed so spreadsheets don't run them as formulas.
- **Limits:** 200 unique parts per run, quantity 1 to 1,000,000, 40 alternate lookups per run.

## Verification so far

- Backend: 297 workspace tests and CI clippy clean. A real 200-line cart priced in 38 s against Digi-Key plus a mock Mouser.
- Web: 144 vitest tests, covering the pure plan logic, the polling hook (409, 404, backoff, offline, unmount, superseded starts), and the page end to end in jsdom. Type-check, lint, and `next build` are clean.
- Browser against the local gateway and live Digi-Key: a 21-line cart, a 200-line run adopted through 409, Apply to cart, reload persistence, the stale banner, and the narrow layout.
- Not yet: a deployed stack (needs a go-ahead), and Mouser for real (no key exists). Multi-source splitting is verified only against the mock.

## Package size

A cart line can carry a size, such as `0402`, `SOT-23-5`, or `1.00mm x 0.50mm`. It is filled from the BOM footprint column and the buyer can edit it. Empty means the run does not filter.

The part number they asked for is always priced. If DigiKey lists a different package, the plan says so. An alternate is proposed only when its published package matches. A part with no published package is not treated as a fit and is not treated as a miss.

When a sized line is short, out of stock, or not found, one DigiKey keyword search (the description plus the size token) may add up to three matching part numbers. Those are unapproved. The buyer still accepts the swap. Prices come from the product-details quote, because keyword price and stock can be a day stale. The search does not use DigiKey's parametric filter ids. Those ids have to be copied from an earlier response, and inventing them returns an empty error.

`Offer.package` stays reel versus cut tape. Ordering stays off.

## Feedback round 1 (Mounir, deployed stack)

- **Plan header read like a dashboard.** Buyers aren't analysts. The four tiles, coverage bar, and status chips become one total and one sentence ("2 of 3 lines are ready to buy. 1 needs a look, listed first."), plus a single "Show only the lines that need a look" toggle for long plans.
- **Status pills.** Ready lines carry no badge. Other statuses are plain coloured text, so the eye lands on the problems.
- **Ask AI showed nothing.** Root cause was infrastructure, not UI: in `us-west-2` Nova Micro has no on-demand throughput, so every Bedrock call (Ask AI and BOM line briefs) failed in about 45 ms with `ValidationException`. The gateway now gets the `us.amazon.nova-micro-v1:0` inference profile, and the task role may invoke it and the three US regional models it routes to (prokuroInfrastructureCDK). The gateway logs the full SDK error instead of "service error" (prokuroBackend). On the page, "Worth adding" now says what Ask AI does before it's used, shows a loading state, and shows a red note when the AI is unavailable. It also says when everything suggested is already in the cart.
- **Native browser controls.** Quantity fields used Chrome's number spinner and the board filter was a native `<select>`. Both are replaced: a − / + stepper (`components/app/QtyInput.tsx`, arrow keys step, non-digits dropped, a cart line can be cleared while typing and snaps back on blur) and a menu in the app's own style (`components/sourcing/BoardPicker.tsx`) that shows each board's part count.

## Not in scope

- Placing split or multi-distributor orders. Ordering stays off, and both `*_ORDERING_ENABLED` flags remain `false`.
- Persisting plans server-side or sharing them between teammates.
