# SCRUM-19 — "This week" dashboard revision

**Status:** decided — ranked severity list, unresolved lines as a count, refresh on focus
**Ticket:** SCRUM-19
**Repos touched:** `prokuroWeb` (most of it), `prokuroGateway` in `prokuroBackend` (two small API changes)

> Design docs live in `design/`, not `docs/` — `docs/` is the generated GitHub Pages output and is served publicly on `prokuro.ai`.

## Problem

The "What to do this week" page shows every flagged line in the account as an equally-weighted row. A buyer cannot tell what is urgent, and the page makes confident-sounding claims while the data behind it is still resolving. The ticket calls this out as being worse because of how unreliable the product is today — that unreliability is visible right here, so this page is where we either earn or lose trust.

## How it works today

`GET /v1/boms/flagged` → `collect_flagged_lines` (`crates/prokuroGateway/src/boms/flagged.rs`) walks every BOM with `at_risk_count > 0`, loads the whole record, and returns every Red and Yellow line. No cap, no ranking, no pagination.

`useFlaggedLines` (`hooks/use-flagged-lines.ts`) fetches that once on mount and never refreshes.

`OverviewPage` (`components/OverviewPage.tsx`) groups the result client-side by `buyerJob` in a fixed order — can't buy, obsolete, tariff, unmatched, other — and renders a `DecisionRow` per line. Within a group there is no sort at all; rows arrive in BOM order, then row order.

## What's wrong, concretely

**The list is unbounded and unranked.** Red and Yellow interleave freely, so a Yellow low-stock line can sit above a Red EOL line. For scale: our 24-BOM local corpus produced 384 at-risk lines across 1,256 MPN-bearing lines. A real account renders hundreds of rows with no priority.

**We already have a ranking function and don't use it.** `select_top_risks` (`crates/prokuroGateway/src/analyze.rs:318`) sorts Red before Yellow, then by row index, and caps the list. It powers per-BOM `top_risks` and the dashboard ignores it.

**Nothing on the page is time-based,** despite being called "this week." No need-by date, no build date, no age of the flag, no "new since you last looked." Today it is a severity list wearing a calendar's name.

**Unresolved lines are invisible here and misreported everywhere else.** Flagged means Red or Yellow only, so a line still being enriched never appears — the page says "No parts need a call this week" when the honest statement is "nothing has resolved yet." Meanwhile `score_risk` maps both Pending and NoMatch to `unknown` (`is_unscored_line`), and the UI labels both **"Unmatched"** (`lib/bomLineDisplay.ts`, `lib/risk.ts`). A part we haven't looked up yet is presented identically to one we looked up and couldn't find.

**One group can never appear.** `buyerJob` returns `unmatched` for `match_status: none` / `NoMatch`, but those lines score `unknown` and are therefore never flagged. That bucket is unreachable.

**No refresh.** Enrichment landing in the background never updates the page.

## Data we don't have yet

| Need | Today | Change required |
|---|---|---|
| "N parts still being checked" | `BomSummary` has `unknown_count` only — Pending and NoMatch are one bucket | Add a pending count to `AnalyzeSummary` + `BomSummary` (`boms/types.rs`), serde-defaulted for existing records |
| Ranked, capped dashboard feed | Unbounded unranked list | Rank and cap in `collect_flagged_lines`, return a total alongside the page |
| "New this week" / flag age | No timestamp for when a line became flagged | Not free — needs per-line history we don't store. Probably out of scope for v1 |

## Proposal, for discussion

Three things to decide as a team:

1. **What the top of the page is.** My suggestion: a small ranked set — the worst handful of lines account-wide — rather than every flagged line. Everything else moves behind "see all."
2. **What the organizing axis is.** Today it is buyer job. Alternatives are severity, or BOM, or a time axis if we ever store need-by dates. Job grouping is defensible, but it currently sits above severity, which is why Reds get buried.
3. **How we show that we don't know yet.** Distinguishing "still checking" from "no catalog match" is the single highest-trust-per-line-of-code change on this list, and it is mostly a frontend change plus one backend field.

Existing design system only — `DecisionRow`, `PageHeader`, `EmptyState`, `appSheet`, and the `mk-*` tokens. No new visual pattern without discussing it first.

## Subtasks, each its own PR

1. **Honest unresolved state (web only).** Split "Checking" from "Unmatched" in the BOM table, the BOM header badge, and the dashboard empty state. Stop saying "nothing needs a call" when nothing has resolved.
2. **Pending count in the API (backend).** Add the field, default it for old records, surface it on `BomSummary` so the BOMs list and dashboard can say how many lines are still resolving.
3. **Rank and cap the flagged feed (backend).** Reuse the `select_top_risks` ordering at account level; return a total so the UI can say "showing 10 of 384."
4. **Dashboard information architecture (web).** Whatever we agree in the discussion above.
5. **Refresh behavior (web).** Decide between polling, a manual refresh, or revalidate-on-focus.

## Testing

Per the working agreement, each subtask is deployed to AWS and verified end to end before its PR — not just exercised locally.

Success path: upload a real BOM containing a known-bad part, confirm first paint reads as "checking" rather than a false all-clear, wait for the drain worker, confirm the line resolves and ranks where we expect. LM7805CT is a known EOL/out-of-stock part that scored Red in the last live test and is a good fixture.

Failure paths to cover: account with no BOMs, account where every line is still pending, a BOM whose lines all resolve to NoMatch, and the flagged endpoint erroring.

## Out of scope

Lead-time trend (we don't compute one), a per-line 1–10 score (only BOM-level `overall_risk_score` exists), and a catalog alternate-part finder (alternates come from the AML column in the customer's own file).

## Decisions

- "This week" is the ranked call list. No need-by date is stored, so it is not a calendar.
- The cap is 10 lines for the whole account, reds first. The page defaults to that order. Job and BOM are optional groupings.
- Lines still being looked up stay off this list. The header shows the pending count. A resolved catalog miss is a separate count.
