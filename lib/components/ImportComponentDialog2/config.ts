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
    placeholder: "Search JLCPCB parts (e.g. C14663)...",
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
