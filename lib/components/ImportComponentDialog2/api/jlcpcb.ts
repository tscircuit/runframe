import { loadEasyedaBrowser } from "lib/optional-features/importing/load-easyeda-browser"
import { createEasyEdaProxyFetch } from "lib/optional-features/importing/create-easyeda-proxy-fetch"
import type { AnyCircuitElement } from "circuit-json"
import type { JlcpcbComponentSummary } from "../types"

interface JlcpcbComponentApiResult {
  description: string
  lcsc: number
  mfr: string
  package: string
  price: number
  stock: number
  is_basic?: boolean
}

interface SearchResponse {
  components: JlcpcbComponentApiResult[]
}

export const searchJlcpcbComponents = async (
  query: string,
  limit = 10,
): Promise<JlcpcbComponentApiResult[]> => {
  const encodedQuery = encodeURIComponent(query)
  const response = await fetch(
    `https://jlcsearch.tscircuit.com/api/search?limit=${limit}&q=${encodedQuery}`,
  )

  if (!response.ok) {
    throw new Error(`JLCPCB API error: ${response.status}`)
  }

  const data: SearchResponse = await response.json()
  return data.components ?? []
}

export const mapJlcpcbComponentToSummary = (
  component: JlcpcbComponentApiResult,
): JlcpcbComponentSummary => ({
  lcscId: component.lcsc,
  manufacturer: component.mfr,
  description: component.description,
  partNumber: `C${component.lcsc}`,
  package: component.package,
  price: component.price,
  stock: component.stock,
  isBasic: component.is_basic,
})

export type JlcpcbPreviewLoadOptions = {
  headers?: Record<string, string>
  apiBase?: string
}

type EasyEdaFetchOptions = JlcpcbPreviewLoadOptions & {
  includeModelMetadata?: boolean
}

const fetchEasyEdaComponentForJlcpcbPart = async (
  partNumber: string,
  opts?: EasyEdaFetchOptions,
) => {
  const { fetchEasyEDAComponent } = await loadEasyedaBrowser()

  return fetchEasyEDAComponent(partNumber, {
    fetch: createEasyEdaProxyFetch(opts),
    includeModelMetadata: opts?.includeModelMetadata,
  })
}

export const loadJlcpcbComponentTsx = async (
  partNumber: string,
  opts?: { headers?: Record<string, string>; apiBase?: string },
): Promise<string> => {
  const { convertRawEasyToTsx } = await loadEasyedaBrowser()

  const component = await fetchEasyEdaComponentForJlcpcbPart(partNumber, opts)

  return convertRawEasyToTsx({ rawEasy: component })
}

export const loadJlcpcbComponentCircuitJson = async (
  partNumber: string,
  opts?: { headers?: Record<string, string>; apiBase?: string },
): Promise<AnyCircuitElement[]> => {
  const { EasyEdaJsonSchema, convertEasyEdaJsonToCircuitJson } =
    await loadEasyedaBrowser()

  const component = await fetchEasyEdaComponentForJlcpcbPart(partNumber, {
    ...opts,
    includeModelMetadata: false,
  })
  const betterEasy = EasyEdaJsonSchema.parse(component)

  return convertEasyEdaJsonToCircuitJson(betterEasy, {
    shouldRecenter: true,
    showDesignator: true,
    useModelCdn: false,
  })
}
