export type ImportSource = "tscircuit.com" | "jlcpcb" | "kicad"

export interface ComponentSearchResult {
  id: string
  name: string
  description?: string
  source: ImportSource
  partNumber?: string
  package?: string
  price?: number
  code?: string
  owner?: string
}

export interface TscircuitPackageDetails {
  ai_description?: string
  ai_usage_instructions?: string
  [key: string]: unknown
}

export interface ImportComponentDialog2Props {
  isOpen: boolean
  onClose: () => void
  proxyRequestHeaders?: Record<string, string>
  onKicadStringSelected?: (payload: {
    component: ComponentSearchResult
    footprint: string
  }) => void | Promise<void>
  onTscircuitPackageSelected?: (payload: {
    component: ComponentSearchResult
    fullPackageName: string
  }) => void | Promise<void>
  onJlcpcbComponentTsxLoaded?: (payload: {
    component: ComponentSearchResult
    tsx: string
  }) => void | Promise<void>
}

export type ImportComponentDialogProps = ImportComponentDialog2Props
