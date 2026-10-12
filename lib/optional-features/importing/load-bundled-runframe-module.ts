import { createDynamicImporter } from "@tscircuit/internal-dynamic-import"

export const loadRunFrameModule = createDynamicImporter({
  "circuit-json-to-bom-csv": () => import("circuit-json-to-bom-csv"),
  "circuit-json-to-gerber": () => import("circuit-json-to-gerber"),
  "circuit-json-to-pnp-csv": () => import("circuit-json-to-pnp-csv"),
  "circuit-json-to-kicad": () => import("circuit-json-to-kicad"),
  "circuit-to-svg": () => import("circuit-to-svg"),
  "kicad-to-circuit-json": () => import("kicad-to-circuit-json"),
  "circuit-json-to-step": () => import("circuit-json-to-step"),
  "circuit-json-to-gltf": () => import("circuit-json-to-gltf"),
  "circuit-json-to-lbrn": () => import("circuit-json-to-lbrn"),
  "circuit-json-to-fdm-component-box": () =>
    import("circuit-json-to-fdm-component-box"),
})
