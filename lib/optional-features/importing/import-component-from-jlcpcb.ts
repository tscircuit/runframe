import { fetchEasyEDAComponent, convertRawEasyToTsx } from "easyeda/browser"
import { API_BASE } from "lib/components/RunFrameWithApi/api-base"
import ky from "ky"

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
          "X-Sender-User-Agent": options?.headers?.userAgent ?? "",
          "X-Sender-Cookie": options?.headers?.cookie ?? "",
        },
      })
    },
  })

  const tsx = await convertRawEasyToTsx(component)

  const fileName = tsx.match(/export const (\w+) = .*/)?.[1]

  if (!fileName) {
    console.error("COULD NOT DETERMINE FILE NAME OF CONVERTED COMPONENT:", tsx)
    throw new Error(`Could not determine file name of converted component`)
  }

  const filePath = `imports/${fileName}.tsx`

  await ky.post(`${API_BASE}/files/upsert`, {
    json: {
      file_path: filePath,
      text_content: tsx,
    },
  })

  return { filePath }
}
