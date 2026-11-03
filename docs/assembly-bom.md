# Assembly BOM review

The BOM tab now displays a tree with nested assembly/subcircuit rows, build
quantity, source selection, product links, unit estimates, subtotals and stock.
The `examples/assembly-bom.fixture.tsx` Cosmos fixture uses deterministic sample
quotes and makes no pricing network requests.

## Data and pricing

The structured converter preserves physical ownership and falls back to
subcircuit groups for existing electronic designs. Build assemblies sum children;
buy assemblies count their own quote and retain children for inspection only.

`BomTable` accepts an optional `partsEngine` with `fetchPartAvailability`.
Otherwise it lazily loads the JLCPCB engine, honoring
`window.TSCIRCUIT_JLCSEARCH_BASE_URL`. The currently supported engine supplies
lowest-tier unit estimates. Arbitrary stores such as Amazon retain product URLs
without requiring automatic pricing. LCSC-only sources remain unpriced when the
chosen engine does not support LCSC; they are not silently quoted as another
supplier.

Requests are deduplicated by supplier/SKU and limited to six concurrent lookups.
Circuit changes, source changes and unmounts cancel/suppress stale responses.
Unknown, unsupported and failed quotes do not become zero prices. Totals remain
separate by currency, and explicitly count unpriced lines. Pack sizes are shown,
but material totals do not round to whole packs.

## Review dependencies

This draft pins the exact previews for:
- https://github.com/tscircuit/circuit-json/pull/958
- https://github.com/tscircuit/circuit-json-to-bom-csv/pull/47

Replace preview dependencies with published versions before merging. The new
converter API is loaded lazily from the pinned runtime dependency; the shared
CDN importer currently has an older converter API. Manufacturing exports retain
their existing converter path and output.

## Follow-up scope

This first slice consumes the new Circuit JSON contract. It does not yet add
TSX purchasing props or emit physical parent metadata from the assembly renderer.
Existing subcircuit grouping works immediately; the fixture exercises physical
assembly ownership directly. Manual prices, quantity tiers, pack-rounded orders,
and a consolidated purchasing view are follow-ups.
