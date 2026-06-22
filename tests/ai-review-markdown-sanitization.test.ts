import { expect, test } from "bun:test"
import { renderAiReviewMarkdown } from "../lib/components/AiReviewDialog/render-ai-review-markdown"

test("AI review markdown renderer does not emit raw script tags without a DOM sanitizer", () => {
  const html = renderAiReviewMarkdown(
    '# Review\n\n<img src=x onerror="alert(1)"><script>alert(1)</script>',
  )

  expect(html).not.toContain("<script")
  expect(html).not.toContain("<img")
  expect(html).toContain("&lt;")
})
