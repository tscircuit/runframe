export type ConverterModuleImporter = <TModule>(
  specifier: string,
) => Promise<TModule>

type ConverterRuntime = "browser" | "node"

type GerberConverterModule = {
  stringifyGerberCommandLayers: (...args: any[]) => Record<string, string>
  convertSoupToGerberCommands: (...args: any[]) => any
  convertSoupToExcellonDrillCommands: (...args: any[]) => any
  stringifyExcellonDrill: (...args: any[]) => string
}

export type BomRow = {
  designator?: string
  comment?: string
  value?: string
  footprint?: string
  supplier_part_number_columns?: Record<string, string>
  extra_columns?: Record<string, string>
  manufacturer_mpn_pairs?: Array<{
    manufacturer: string
    mpn: string
  }>
}

type BomCsvConverterModule = {
  convertCircuitJsonToBomRows: (...args: any[]) => Promise<BomRow[]> | BomRow[]
  convertBomRowsToCsv: (...args: any[]) => Promise<string> | string
}

type PnpCsvConverterModule = {
  convertCircuitJsonToPickAndPlaceCsv: (
    ...args: any[]
  ) => Promise<string> | string
}

type RunnableStringConverter = new (
  ...args: any[]
) => {
  runUntilFinished: () => void
  getOutputString: () => string
}

type KicadPcbConverter = new (
  ...args: any[]
) => {
  runUntilFinished: () => void
  getOutputString: () => string
  getModel3dSourcePaths: () => string[]
}

type KicadLibraryConverter = new (
  ...args: any[]
) => {
  runUntilFinished: () => void
  getOutput: () => {
    kicadSymString: string
    footprints: Array<{
      footprintName: string
      kicadModString: string
    }>
    model3dSourcePaths: string[]
    fpLibTableString: string
    symLibTableString: string
  }
}

type KicadConverterModule = {
  CircuitJsonToKicadPcbConverter: KicadPcbConverter
  CircuitJsonToKicadSchConverter: RunnableStringConverter
  CircuitJsonToKicadProConverter: RunnableStringConverter
  CircuitJsonToKicadLibraryConverter: KicadLibraryConverter
  resolveAndLoadKicad3dModelFiles: (options: {
    projectName: string
    model3dSourcePaths: string[]
    fetch: typeof fetch
    onModelFile: (args: { outputPath: string; content: any }) => void
    onError: (args: { sourcePath: string; error?: unknown }) => void
  }) => Promise<void>
}

type GltfConverterModule = {
  convertCircuitJsonToGltf: (
    ...args: any[]
  ) => Promise<ArrayBuffer> | ArrayBuffer
}

type StepConverterModule = {
  circuitJsonToStep: (...args: any[]) => Promise<string> | string
}

type LbrnConverterModule = {
  convertCircuitJsonToLbrn: (...args: any[]) => Promise<{ toXml: () => string }>
}

type ConverterModules = {
  "circuit-json-to-gerber": GerberConverterModule
  "circuit-json-to-bom-csv": BomCsvConverterModule
  "circuit-json-to-pnp-csv": PnpCsvConverterModule
  "circuit-json-to-kicad": KicadConverterModule
  "circuit-json-to-gltf": GltfConverterModule
  "circuit-json-to-step": StepConverterModule
  "circuit-json-to-lbrn": LbrnConverterModule
}

export type ConverterPackageName = keyof ConverterModules

const CONVERTER_CDN_URLS: Record<ConverterPackageName, string> = {
  "circuit-json-to-gerber":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-gerber@0.0.78/+esm",
  "circuit-json-to-bom-csv":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-bom-csv@0.0.9/+esm",
  "circuit-json-to-pnp-csv":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-pnp-csv@0.0.7/+esm",
  "circuit-json-to-kicad":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-kicad@0.0.155/+esm",
  "circuit-json-to-gltf":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-gltf@0.0.105/+esm",
  "circuit-json-to-step":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-step@0.0.36/+esm",
  "circuit-json-to-lbrn":
    "https://cdn.jsdelivr.net/npm/circuit-json-to-lbrn@0.0.74/+esm",
}

const converterModulePromises = new Map<string, Promise<unknown>>()

const detectConverterRuntime = (): ConverterRuntime =>
  typeof window === "undefined" || typeof document === "undefined"
    ? "node"
    : "browser"

const importConverterModule: ConverterModuleImporter = (specifier) =>
  import(/* @vite-ignore */ specifier)

export const getConverterCdnUrl = (packageName: ConverterPackageName) =>
  CONVERTER_CDN_URLS[packageName]

export const getConverterImportSpecifier = (
  packageName: ConverterPackageName,
  runtime: ConverterRuntime = detectConverterRuntime(),
) => (runtime === "browser" ? getConverterCdnUrl(packageName) : packageName)

export const clearConverterModuleCache = () => {
  converterModulePromises.clear()
}

export const loadConverterModule = async <TName extends ConverterPackageName>(
  packageName: TName,
  options: {
    importer?: ConverterModuleImporter
    runtime?: ConverterRuntime
  } = {},
): Promise<ConverterModules[TName]> => {
  const importer = options.importer ?? importConverterModule
  const specifier = getConverterImportSpecifier(packageName, options.runtime)

  let modulePromise = converterModulePromises.get(specifier) as
    | Promise<ConverterModules[TName]>
    | undefined

  if (!modulePromise) {
    modulePromise = importer<ConverterModules[TName]>(specifier).catch(
      (error) => {
        converterModulePromises.delete(specifier)
        throw error
      },
    )
    converterModulePromises.set(specifier, modulePromise)
  }

  return modulePromise
}

export const loadGerberConverter = () =>
  loadConverterModule("circuit-json-to-gerber")

export const loadBomCsvConverter = () =>
  loadConverterModule("circuit-json-to-bom-csv")

export const loadPnpCsvConverter = () =>
  loadConverterModule("circuit-json-to-pnp-csv")

export const loadKicadConverter = () =>
  loadConverterModule("circuit-json-to-kicad")

export const loadGltfConverter = () =>
  loadConverterModule("circuit-json-to-gltf")

export const loadStepConverter = () =>
  loadConverterModule("circuit-json-to-step")

export const loadLbrnConverter = () =>
  loadConverterModule("circuit-json-to-lbrn")
