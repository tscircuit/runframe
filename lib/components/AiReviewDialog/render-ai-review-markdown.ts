import createDOMPurify from "dompurify"
import { marked } from "marked"

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

export const renderAiReviewMarkdown = (markdown: string): string => {
  const html = marked.parse(markdown || "") as string
  const purifier =
    typeof window === "undefined" ? undefined : createDOMPurify(window)

  if (purifier?.isSupported && typeof purifier.sanitize === "function") {
    return purifier.sanitize(html, {
      USE_PROFILES: { html: true },
    })
  }

  return escapeHtml(html)
}
