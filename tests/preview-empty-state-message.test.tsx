import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import PreviewEmptyState from "../lib/components/PreviewEmptyState"

test("PreviewEmptyState shows the empty-state message when provided", () => {
  const html = renderToStaticMarkup(
    <PreviewEmptyState message="No files provided. Please provide at least one file with code to execute." />,
  )

  expect(html).toContain("No files provided")
  expect(html).not.toContain("Tip:")
})

test("PreviewEmptyState falls back to a tip when no message is provided", () => {
  const html = renderToStaticMarkup(<PreviewEmptyState />)

  expect(html).toContain("Tip:")
})
