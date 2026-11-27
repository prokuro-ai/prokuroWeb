# Sourcing substitutes

**Status:** in progress. Digi-Key only. Shown in the expanded BOM line, and on the sourcing plan after a run.

## What it does

Opening an out-of-stock, unmatched, or end-of-life line asks Digi-Key for that product's substitute list and shows up to three in-stock manufacturer part numbers in the expanded row, each quoted at the line qty with an on-line savings figure when the current part has a list price. Digi-Key's `substitute_type` (e.g. Similar) is shown — Prokuro does not re-validate electrical fit. AML parts stay labeled as AML. **Use** writes the chosen part onto that line and the line is looked up again. It is not marked as an approved alternate.


When **Source this cart** cannot buy a line, the same list is quoted and the winner appears on the existing swap row. The buyer accepts it there for the cart. Covered lines are unchanged: only an approved AML part that saves at least 10% and $1 is proposed.

The description-plus-package search still runs when the substitute list is empty or the call fails, and the line names a package.

## Flow

1. Quote the line at the distributors already configured.
2. If the line is out of stock, not found, short, or the wrong package, call `GET /products/v4/search/{productNumber}/substitutions`.
3. Use the Digi-Key product number from that quote when we have one. Otherwise use the manufacturer part number.
4. Keep a row only when it is in stock, and only after a trailing `\digits` reel quantity is removed (`PART\500` becomes `PART`). Anything else that is not a safe part number is skipped, including a backslash that is not a quantity.
5. Quote those part numbers through the existing alternate lookup. The list price is ignored. The run still stops at 40 alternate lookups, and Mouser still sees at most the lines that fit its search limit, so a long cart returns a plan instead of a string of rate-limit errors.
6. The existing picker prefers an approved AML part, then the cheapest substitute that covers the quantity and matches a package the buyer named.

## Failure modes

- The substitutions call returns an HTTP error: the line stays as it was, and the package search still runs.
- Digi-Key is not configured: no substitute call.
- A substitute is the same part number as the line: it is dropped.
- Accepting the swap changes the cart only. On the BOM, opening the line looks the list up itself, and **Use** writes the chosen part onto that line. The line then looks up the new part number. It is still not marked as an approved alternate.

## Not in this change

Parametric search and other-brand drop-ins. Using a substitute on the BOM replaces that line's part number. It does not add the part to the approved list.
