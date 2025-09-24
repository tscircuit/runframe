import { fetchEasyEDAComponent, convertRawEasyToTsx } from "easyeda/browser"
import { API_BASE } from "lib/components/RunFrameWithApi/api-base"
import type { JlcpcbComponentSummary } from "../types"

interface JlcpcbComponentApiResult {
  description: string
  lcsc: number
  mfr: string
  package: string
  price: number
  stock: number
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
})

export const loadJlcpcbComponentTsx = async (
  partNumber: string,
  opts?: { headers?: Record<string, string> },
): Promise<string> => {
  const component = await fetchEasyEDAComponent(partNumber, {
    // @ts-ignore
    fetch: (url, options: RequestInit & { headers?: Record<string, string> }) =>
      fetch(`${API_BASE}/proxy`, {
        ...options,
        headers: {
          ...options?.headers,
          "X-Target-Url": url.toString(),
          "X-Sender-Origin": options?.headers?.origin ?? "",
          "X-Sender-Host": options?.headers?.host ?? "https://easyeda.com",
          "X-Sender-Referer": options?.headers?.referer ?? "",
          "X-Sender-User-Agent": options?.headers?.userAgent ?? "",
          "X-Sender-Cookie": options?.headers?.cookie ?? "",
          ...opts?.headers,
        },
      }),
  })

  return convertRawEasyToTsx(component)
}
