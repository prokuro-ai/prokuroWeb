# Buyer path hardening (post A–H smoke)

## What

Close gaps found after cart supplier-link smoke so buyers can price → need-by → supplier link without silent wrong-line edits or dropped dates.

## Touches

- `prokuroWeb`: `BomResultPage` (substitute index), `sourcingPlan.applyPlan` (keep need-by on swap), small need-by clear UX if cheap
- No CDK. Ordering / Orders API stays out of UI; not in this PR

## Architecture

Same Amplify → gateway → S3 BOM store. Substitute and plan apply are client/API index correctness only.

## Failure modes

- Wrong list index → patch wrong BOM line or 404
- Plan swap without `need_by` → cart loses date Chrome already set
- Invalid need-by draft → user clears to empty; must save clear without Retry trap when draft is empty
