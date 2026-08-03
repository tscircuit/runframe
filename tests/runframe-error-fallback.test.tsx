import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import { RunFrameErrorFallback } from "../lib/components/RunFrame/RunFrameErrorFallback"

test("RunFrameErrorFallback shows the React component stack", () => {
  const html = renderToStaticMarkup(
    <RunFrameErrorFallback
      error={new Error("Rendered fewer hooks than expected")}
      resetErrorBoundary={() => {}}
      componentStack={
        "\n    at CircuitJsonPreview (CircuitJsonPreview.tsx:42)\n    at RunFrame (RunFrame.tsx:99)"
      }
    />,
  )

  expect(html).toContain("View component stack")
  expect(html).toContain("CircuitJsonPreview")
  expect(html).toContain("RunFrame")
})
