# Sourcing substitutes

**Status:** in progress. Digi-Key only. Shown on the sourcing plan and, after a run, in the expanded BOM line.

## What it does

When **Source this cart** cannot buy a line, Prokuro asks Digi-Key for that product's substitute list and quotes up to three in-stock manufacturer part numbers. The winner, if one can be bought in full, appears on the existing swap row. The buyer accepts it there for the cart. The same part also shows in the expanded BOM line, where **Use** writes it onto that line and the line is looked up again. It is not marked as an approved alternate.

Covered lines are unchanged: only an approved AML part that saves at least 10% and $1 is proposed.

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
- Accepting the swap changes the cart only. On the BOM, the expanded line shows the same part and **Use** writes it onto that line. The line then looks up the new part number. It is still not marked as an approved alternate.

## Not in this change

Parametric search, other-brand drop-ins, and calling Digi-Key from the score panel. Using a substitute on the BOM replaces that line's part number. It does not add the part to the approved list.
