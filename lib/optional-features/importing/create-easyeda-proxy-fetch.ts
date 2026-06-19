import { API_BASE } from "lib/components/RunFrameWithApi/api-base"

export type EasyEdaProxyFetchOptions = {
  apiBase?: string
  headers?: Record<string, string>
}

export const createEasyEdaProxyFetch = (opts?: EasyEdaProxyFetchOptions) =>
  (url: RequestInfo | URL, options?: RequestInit) => {
    const headers = options?.headers as Record<string, string> | undefined

    return fetch(`${opts?.apiBase ?? API_BASE}/proxy`, {
      ...options,
      headers: {
        ...headers,
        "X-Target-Url": url.toString(),
        "X-Sender-Origin": headers?.origin ?? "",
        "X-Sender-Host": headers?.host ?? "https://easyeda.com",
        "X-Sender-Referer": headers?.referer ?? "",
        "X-Sender-User-Agent": headers?.userAgent ?? "",
        "X-Sender-Cookie": headers?.cookie ?? "",
        authority: headers?.authority ?? "",
        "content-type": headers?.["content-type"] ?? "",
        ...opts?.headers,
      },
    })
  }
