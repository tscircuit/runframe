# Assembly BOM review

The BOM tab displays collapsible assembly/subcircuit rows, build quantity,
supplier selection, all purchase links, unit estimates, subtotals and stock.
The `examples/assembly-bom.fixture.tsx` Cosmos fixture combines explicit enclosure
materials with a PCB subcircuit and uses deterministic sample quotes.

## Data and pricing

The structured converter consumes `cad_assembly_bom_item` from released
`circuit-json@0.0.543`. Explicit entries own their quantities and parent nesting;
source/CAD references replace matching fallback PCB rows. Remaining electronic
parts appear under their existing subcircuits. CAD geometry counts do not set BOM
quantities.

Each material line contributes its own quote once, including parent and child
materials. A parent subtotal includes its descendants; collapsing a row does not
change totals. Subcircuit rows are display groups with no independent price.
Parentage does not imply that children are included in a purchased parent.

Supplier options come from `supplier_part_numbers`. All `purchase_urls` are shown
independently; changing the selected SKU never changes these links. Arbitrary
stores such as Amazon work without automatic pricing. URL-only entries count as
unpriced, not free. The UI does not associate URLs with SKUs by position.

`BomTable` accepts an optional `partsEngine` with `fetchPartAvailability`.
Otherwise it lazily loads the JLCPCB engine, honoring
`window.TSCIRCUIT_JLCSEARCH_BASE_URL`. The engine supplies lowest-tier unit
estimates. Unsupported suppliers remain unpriced; LCSC is not silently quoted as
JLCPCB. Requests are deduplicated by supplier/SKU and limited to six concurrent
lookups. Circuit changes, supplier changes and unmounts cancel/suppress stale
responses. Unknown, unsupported and failed quotes do not become zero prices.
Totals remain separate by currency and explicitly count unpriced material lines.
Quantity discounts, pack rounding, shipping and tax are excluded.

## Review dependency

This draft uses the released Circuit JSON schema and pins the exact package
preview for [circuit-json-to-bom-csv#47](https://github.com/tscircuit/circuit-json-to-bom-csv/pull/47).
Replace that preview with a published converter version before merging.
The new API is loaded lazily from the pinned runtime dependency; the shared CDN
importer currently has an older converter API. Manufacturing exports retain
their existing converter path and output.

## Follow-up scope

This slice consumes Circuit JSON records directly. TSX authoring and renderer
emission of `cad_assembly_bom_item` are follow-up work. Existing subcircuit
grouping works immediately; the fixture exercises explicit assembly records.
Manual prices, quantity tiers, pack-rounded orders and a consolidated purchasing
view are also outside this slice.
