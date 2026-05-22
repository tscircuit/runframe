import { describe, expect, it } from "bun:test"
import { getConverterCdnUrl } from "./dynamic-converters"

describe("dynamic converter URLs", () => {
  it("uses pinned jsDelivr ESM URLs", () => {
    expect(getConverterCdnUrl("circuit-json-to-gerber")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-gerber@0.0.70/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-bom-csv")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@0.0.8/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-pnp-csv")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-pnp-csv@0.0.7/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-kicad")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-kicad@0.0.137/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-gltf")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-gltf@0.0.100/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-step")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-step@0.0.28/+esm",
    )
    expect(getConverterCdnUrl("circuit-json-to-lbrn")).toBe(
      "https://cdn.jsdelivr.net/npm/circuit-json-to-lbrn@0.0.74/+esm",
    )
  })
})
