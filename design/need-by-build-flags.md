# Need-by (web)

Mirrors `prokuroBackend/design/need-by-build-flags.md`.

- Need-by is set in Prokuro only (banner + edit). Not ingested from BOM column mapping.
- Apply-all calls `POST /api/boms/{id}/need-by`.
- Lead highlight uses `leadMissesNeedBy`, which ignores factory lead when stock covers qty.
