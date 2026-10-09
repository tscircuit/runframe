import { getDefaultRuntime } from "lib/runtime/default-runtime"
import type { RunFrameRuntime } from "lib/runtime/types"
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
  runtime = getDefaultRuntime(),
): Promise<JlcpcbComponentApiResult[]> => {
  const encodedQuery = encodeURIComponent(query)
  const response = await runtime.fetch(
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
  runtime?: RunFrameRuntime
}

type EasyEdaFetchOptions = JlcpcbPreviewLoadOptions & {
  includeModelMetadata?: boolean
}

const fetchEasyEdaComponentForJlcpcbPart = async (
  partNumber: string,
  opts?: EasyEdaFetchOptions,
) => {
  if (opts?.runtime?.mode === "offline") {
    throw new Error(
      "EasyEDA part acquisition requires a local catalog; convert a supplied EasyEDA file offline instead.",
    )
  }
  const { fetchEasyEDAComponent } = await loadEasyedaBrowser(opts?.runtime)

  return fetchEasyEDAComponent(partNumber, {
    // easyeda calls the browser Fetch API; Bun's additional preconnect member
    // is not part of this converter callback contract.
    fetch: createEasyEdaProxyFetch(opts) as typeof fetch,
    includeModelMetadata: opts?.includeModelMetadata,
  })
}

export const loadJlcpcbComponentTsx = async (
  partNumber: string,
  opts?: JlcpcbPreviewLoadOptions,
): Promise<string> => {
  const { convertRawEasyToTsx } = await loadEasyedaBrowser(opts?.runtime)

  const component = await fetchEasyEdaComponentForJlcpcbPart(partNumber, opts)

  return convertRawEasyToTsx({ rawEasy: component })
}

export const loadJlcpcbComponentCircuitJson = async (
  partNumber: string,
  opts?: JlcpcbPreviewLoadOptions,
): Promise<AnyCircuitElement[]> => {
  const { EasyEdaJsonSchema, convertEasyEdaJsonToCircuitJson } =
    await loadEasyedaBrowser(opts?.runtime)

  const component = await fetchEasyEdaComponentForJlcpcbPart(partNumber, {
    ...opts,
    includeModelMetadata: false,
  })
  // Use the supplier's actual footprint data instead of inferring a package.
  const betterEasy = EasyEdaJsonSchema.parse(component)

  return convertEasyEdaJsonToCircuitJson(betterEasy, {
    shouldRecenter: true,
    showDesignator: true,
    useModelCdn: false,
  })
}
