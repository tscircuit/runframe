import { JSDOM } from "jsdom"

const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>")
;(globalThis as any).window = dom.window
;(globalThis as any).document = dom.window.document

import { beforeAll, describe, expect, test } from "bun:test"
import { marked } from "marked"
import type DOMPurifyType from "dompurify"

let DOMPurify: typeof DOMPurifyType

beforeAll(async () => {
  DOMPurify = (await import("dompurify")).default
})

function renderAiReview(text: string): string {
  return DOMPurify.sanitize(marked.parse(text || "") as string)
}

describe("AI review XSS sanitization", () => {
  test("BEFORE-fix baseline: marked.parse alone passes onerror payload through", () => {
    const payload = "<img src=x onerror=alert(1)>"
    const raw = marked.parse(payload) as string
    // Demonstrates the vulnerability: the dangerous attribute survives marked unmodified
    expect(raw).toContain("onerror")
  })

  test("sanitized output strips onerror from img tag", () => {
    const payload = "<img src=x onerror=alert(1)>"
    const safe = renderAiReview(payload)
    expect(safe).not.toContain("onerror")
  })

  test("sanitized output strips inline script tag", () => {
    const payload = "<script>alert('xss')</script>"
    const safe = renderAiReview(payload)
    expect(safe).not.toContain("<script>")
    expect(safe).not.toContain("alert")
  })

  test("sanitized output strips javascript: href", () => {
    const payload = "[click](javascript:alert(1))"
    const safe = renderAiReview(payload)
    expect(safe).not.toContain("javascript:")
  })

  test("normal markdown content is preserved after sanitization", () => {
    const md = "## Hello\n\nThis is **bold** and _italic_."
    const safe = renderAiReview(md)
    expect(safe).toContain("<h2>Hello</h2>")
    expect(safe).toContain("<strong>bold</strong>")
    expect(safe).toContain("<em>italic</em>")
  })
})
