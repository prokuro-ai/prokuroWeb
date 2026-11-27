# Need-by (web)

Mirrors `prokuroBackend/design/need-by-build-flags.md`.

- Need-by is set in Prokuro only. Not ingested from BOM column mapping.
- **Placement:** BOM page only (build schedule). Not inside sourcing / cart.
  Sourcing and confirmations may *display* the date later; they do not own setting it.
- Entry points: toolbar **Need by**, compact “Set a need-by date” strip when empty,
  Edit mode per line. No auto-popping full banner.
- Apply-all calls `POST /api/boms/{id}/need-by`.
- Lead highlight uses `leadMissesNeedBy`, which ignores factory lead when stock covers qty.
