import { fetchEasyEDAComponent } from "easyeda"
import { API_BASE } from "lib/components/RunFrameWithApi/api-base"

export const importComponentFromJlcpcb = async (jlcpcbPartNumber: string) => {
  const component = await fetchEasyEDAComponent(jlcpcbPartNumber, {
    fetch: (url, options: any) => {
      return fetch(`${API_BASE}/proxy`, {
        ...options,
        headers: {
          ...options?.headers,
          "X-Target-Url": url.toString(),
          "X-Sender-Origin": options?.headers?.origin ?? "",
          "X-Sender-Host": options?.headers?.host ?? "https://easyeda.com",
          "X-Sender-Referer": options?.headers?.referer ?? "",
        },
      })
    },
  })

  console.log(component)
}
