# Need-by ingest + apply-to-all (web)

Mirrors `prokuroBackend/design/need-by-build-flags.md`.

- Column mapping includes **Need by**
- BOM page banner asks: one date for all / per part / skip
- Apply-all calls `POST /api/boms/{id}/need-by`
- Per-line edit table still works; lead flags use line `need_by`

No marketing/`docs/` impact.