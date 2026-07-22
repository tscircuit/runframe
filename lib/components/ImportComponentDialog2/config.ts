import type { ImportSource } from "./types"

interface SourceConfig {
  label: string
  placeholder: string
  emptyMessage: string
}

export const SOURCE_CONFIG: Record<ImportSource, SourceConfig> = {
  "tscircuit.com": {
    label: "tscircuit.com",
    placeholder: "Search tscircuit packages...",
    emptyMessage: "No packages found",
  },
  jlcpcb: {
    label: "JLCPCB Parts",
    placeholder: "Search JLCPCB parts or enter an exact LCSC ID...",
    emptyMessage: "No parts found",
  },
  kicad: {
    label: "KiCad Footprints",
    placeholder: "Search KiCad footprints...",
    emptyMessage: "No footprints found",
  },
}

export const DEFAULT_SOURCES: ImportSource[] = [
  "tscircuit.com",
  "jlcpcb",
  "kicad",
]

export const getInitialSource = (sources: ImportSource[]): ImportSource => {
  return sources[0] ?? "tscircuit.com"
}
