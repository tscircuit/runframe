import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import type { SolverStartedEvent } from "../lib/components/CircuitJsonPreview/PreviewContentProps"
import { SolversTabContent } from "../lib/components/SolversTabContent/SolversTabContent"

test("shows separate solver instances with the same component and solver names", () => {
  const solverEvent: SolverStartedEvent = {
    type: "solver:started",
    solverName: "LayoutPipelineSolver",
    solverParams: {},
    componentName: "<board#1 />",
  }

  const html = renderToStaticMarkup(
    <SolversTabContent solverEvents={[solverEvent, solverEvent]} />,
  )

  expect(html).toContain("2 Solvers")
  expect(html.match(/LayoutPipelineSolver/g)).toHaveLength(2)
})
