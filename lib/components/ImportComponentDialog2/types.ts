import type { Package } from "@tscircuit/fake-snippets/schema"
import type { PlatformConfig } from "@tscircuit/props"
import type { DatasheetCatalogEntry } from "lib/optional-features/importing/datasheet-catalog/catalog"

export type ImportSource = "tscircuit.com" | "jlcpcb" | "kicad" | "datasheets"

export interface TscircuitPackageDetails {
  ai_description?: string
  ai_usage_instructions?: string
  [key: string]: unknown
}

export interface TscircuitPackageSearchResult {
  source: "tscircuit.com"
  package: Package
}

export interface JlcpcbComponentSummary {
  lcscId: number
  manufacturer: string
  partNumber: string
  description: string
  package: string
  price?: number
  stock?: number
  isBasic?: boolean // true = basic, false = extended
  isDirectLookup?: boolean
}

export interface JlcpcbComponentSearchResult {
  source: "jlcpcb"
  component: JlcpcbComponentSummary
}

export interface KicadFootprintSummary {
  path: string
  qualifiedName: string
  description?: string
}

export interface KicadFootprintSearchResult {
  source: "kicad"
  footprint: KicadFootprintSummary
}

export interface DatasheetComponentSearchResult {
  source: "datasheets"
  datasheet: DatasheetCatalogEntry
}

export type ImportComponentDialogSearchResult =
  | TscircuitPackageSearchResult
  | JlcpcbComponentSearchResult
  | KicadFootprintSearchResult
  | DatasheetComponentSearchResult

export interface ImportComponentDialog2Props {
  isOpen: boolean
  onClose: () => void
  jlcpcbProxyRequestHeaders?: Record<string, string>
  jlcpcbProxyApiBase?: string
  tscircuitSessionToken?: string
  /** Use only the datasheet catalog provided by platformFetch. */
  cachedDatasheetImports?: boolean
  platformConfig?: PlatformConfig
  onKicadStringSelected?: (
    payload: KicadStringSelectedPayload,
  ) => void | Promise<void>
  onTscircuitPackageSelected?: (
    payload: TscircuitPackageSelectedPayload,
  ) => void | Promise<void>
  onJlcpcbComponentTsxLoaded?: (
    payload: JlcpcbComponentTsxLoadedPayload,
  ) => void | Promise<void>
  onDatasheetComponentTsxLoaded?: (
    payload: DatasheetComponentTsxLoadedPayload,
  ) => void | Promise<void>
}

export type ImportComponentDialogProps = ImportComponentDialog2Props

export interface KicadStringSelectedPayload {
  result: KicadFootprintSearchResult
  footprint: string
}

export interface TscircuitPackageSelectedPayload {
  result: TscircuitPackageSearchResult
  fullPackageName: string
}

export interface JlcpcbComponentTsxLoadedPayload {
  result: JlcpcbComponentSearchResult
  tsx: string
}

export interface DatasheetComponentTsxLoadedPayload {
  result: DatasheetComponentSearchResult
  tsx: string
}
