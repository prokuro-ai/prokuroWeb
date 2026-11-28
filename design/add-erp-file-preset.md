# Add a file-export ERP preset

**Status:** recipe for contributors (Yusuf / Sinjab).  
**Repos:** `prokuroWeb` + `prokuroBackend` (parser). No CDK.  
**Not this doc:** live API connectors — see `design/erp-live-connectors.md` (parked).

## What you are adding

A **file import** path: customer exports CSV/Excel from their ERP → picks our preset → we map columns via ERP header hints → same analyze pipeline with `source_erp` set.

One ERP id per small PR (`feat/erp-<id>-file-preset`). Do not batch five ERPs in one PR.

## Existing ids

`sap` | `netsuite` | `dynamics` | `epicor` | `quickbooks` | `other`

| Id | Sample fixture |
|---|---|
| sap | `corpus/raw/erp-sap-cs12.csv` |
| netsuite | `corpus/raw/erp-netsuite-bom.csv` |
| dynamics | `corpus/raw/erp-dynamics-bc.csv` |
| epicor | `corpus/raw/erp-epicor-bom.csv` |
| quickbooks | `corpus/raw/erp-quickbooks-bom.csv` |
| other / multilevel | `corpus/raw/erp-multilevel-bom.csv` |

Expected JSON mirrors under `corpus/expected/erp-*.json`.

## Checklist (every new or hardened ERP)

Copy this into the PR description and check boxes as you go.

### 1. Parser allowlist + aliases

File: `prokuroBackend/crates/prokuroParser/src/detect/erp.rs`

- [ ] Add id to `ERP_IDS` (unless already present).
- [ ] Add `normalize_erp_id` match arms for common spellings (e.g. `d365` → `dynamics`).
- [ ] Add `erp_header_hints` entries: **exact** export headers → canonical fields (`mpn`, `qty`, `manufacturer`, `description`, …). Prefer the component/member column over parent assembly columns.
- [ ] If a header is unambiguous and useful for all ERPs, add it to `shared_erp_aliases` (avoid bare `item` / `component` unless ERP-scoped).

### 2. UI preset + export howto

File: `prokuroWeb/lib/erp.ts`

- [ ] Add `ErpId` union member (if new).
- [ ] Add `ERP_PRESETS` entry: `label`, `shortLabel`, `blurb`, `exportSteps` (customer-facing, no Digi-Key/Mouser, no fake “live connected”).
- [ ] Confirm Settings → Integrations and bulk upload dropdown show the preset.

### 3. Corpus fixture

- [ ] Add realistic `corpus/raw/erp-<name>.csv` (header row required; title block above table OK).
- [ ] Add matching `corpus/expected/erp-<name>.json` from the parser corpus harness.
- [ ] Run parser/corpus tests until green for that fixture.

### 4. Gateway / prefs

Prefs and saved mappings already accept known ids once parser + UI agree. No new Dynamo table.

- [ ] Smoke: set default ERP in Settings; upload with a **different** preset; default stays unchanged.
- [ ] Optional: save column mapping for that ERP; re-upload reuses it.
- [ ] “Request live sync” stays waitlist-only — do not imply API connect.

### 5. Verification before merge

- [ ] Local or deployed: upload fixture with matching preset → MPN/qty mapped as expected → BOM saved with `source_erp=<id>`.
- [ ] Chrome (local-only prompt, never commit): one happy-path import for this ERP.
- [ ] No Place order / Orders chrome regressions on Sourcing.

## Split of labor (default)

- **Yusuf (Chrome on Amplify):** verify **SAP, NetSuite, Dynamics** end-to-end with `@prokuro.ai`.
- **Sinjab (template PRs):** harden or extend **Epicor, QuickBooks**, plus any **new** agreed id — one PR each following this checklist.

## Done means

Preset selectable → howto renders → fixture maps correctly → analyze stores `source_erp` → Settings default / mappings behave → live sync is still honestly a waitlist.
