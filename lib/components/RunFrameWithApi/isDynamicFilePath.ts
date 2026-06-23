export const DYNAMIC_FILE_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".kicad_pcb",
  ".kicad_sch",
  ".kicad_prl",
  ".kicad_pro",
]

export const isDynamicFilePath = (filePath: string) =>
  DYNAMIC_FILE_EXTENSIONS.some((ext) => filePath.endsWith(ext))
