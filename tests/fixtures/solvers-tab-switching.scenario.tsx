import { afterEach, beforeEach, expect, test } from "bun:test"
import { SOLVERS } from "@tscircuit/core"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import type { SolverStartedEvent } from "../../lib/components/CircuitJsonPreview/PreviewContentProps"
import { SolversTabContent } from "../../lib/components/SolversTabContent/SolversTabContent"

// Real solvers with empty, valid inputs isolate selection from routing complexity.
const packInput = {
  components: [],
  minGap: 0.2,
  packOrderStrategy: "largest_to_smallest",
  packPlacementStrategy: "minimum_sum_squared_distance_to_network",
} satisfies ConstructorParameters<typeof SOLVERS.PackSolver2>[0]

const schematicInput = {
  chips: [],
  directConnections: [],
  netConnections: [],
  availableNetLabelOrientations: {},
} satisfies ConstructorParameters<typeof SOLVERS.SchematicTracePipelineSolver>[0]

const solverEvents: SolverStartedEvent[] = [
  {
    type: "solver:started",
    componentName: "<board#1 />",
    solverName: "PackSolver2",
    solverParams: packInput,
    solverConstructorArgs: [packInput],
  },
  {
    type: "solver:started",
    componentName: "<board#1 />",
    solverName: "SchematicTracePipelineSolver",
    solverParams: schematicInput,
    solverConstructorArgs: [schematicInput],
  },
  {
    type: "solver:started",
    componentName: "<board#1 />",
    solverName: "MissingSolverForSwitchTest",
    solverParams: {},
    solverConstructorArgs: [{}],
  },
]

const browserGlobals = [
  "window",
  "document",
  "localStorage",
  "Element",
  "HTMLElement",
  "Node",
  "Event",
  "MouseEvent",
  "MutationObserver",
  "getComputedStyle",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "IS_REACT_ACT_ENVIRONMENT",
] as const
const previousGlobals = Object.getOwnPropertyDescriptors(globalThis)
let dom: JSDOM
let root: Root
let container: HTMLDivElement

beforeEach(() => {
  dom = new JSDOM("<!doctype html><html><head></head><body></body></html>", {
    url: "http://localhost/",
    pretendToBeVisual: true,
  })
  for (const key of browserGlobals) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value:
        key === "IS_REACT_ACT_ENVIRONMENT"
          ? true
          : Reflect.get(dom.window, key),
    })
  }
  container = document.createElement("div")
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  dom.window.close()
  for (const key of browserGlobals) {
    const previous = previousGlobals[key]
    if (previous) Object.defineProperty(globalThis, key, previous)
    else Reflect.deleteProperty(globalThis, key)
  }
})

async function selectSolver(solverName: string) {
  const label = Array.from(container.querySelectorAll(".rf-truncate")).find(
    (element) => element.textContent === solverName,
  )
  expect(label).toBeDefined()
  await act(async () => {
    label!.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }))
  })
}

function expectDisplayedSolver(solverName: string) {
  const nameButtons = container.querySelectorAll(
    'button[title^="Download options for "]',
  )
  expect(nameButtons).toHaveLength(1)
  expect(nameButtons[0]!.getAttribute("title")).toBe(
    `Download options for ${solverName}`,
  )
  expect(container.textContent).toMatch(/Iterations:\s*0\b/)
}

for (const [firstSolver, secondSolver] of [
  ["PackSolver2", "SchematicTracePipelineSolver"],
  ["SchematicTracePipelineSolver", "PackSolver2"],
] as const) {
  test(`switches ${firstSolver} -> ${secondSolver} -> ${firstSolver}`, async () => {
    await act(async () => {
      root.render(<SolversTabContent solverEvents={solverEvents} />)
    })

    await selectSolver(firstSolver)
    expectDisplayedSolver(firstSolver)

    await selectSolver(secondSolver)
    expectDisplayedSolver(secondSolver)

    await selectSolver(firstSolver)
    expectDisplayedSolver(firstSolver)
  })
}

test("keeps a missing-solver error visible and permits another selection", async () => {
  await act(async () => {
    root.render(<SolversTabContent solverEvents={solverEvents} />)
  })
  await selectSolver("PackSolver2")
  expectDisplayedSolver("PackSolver2")

  await selectSolver("MissingSolverForSwitchTest")
  expect(container.textContent).toContain(
    'Solver class "MissingSolverForSwitchTest" not found',
  )
  expect(
    container.querySelector('button[title^="Download options for "]'),
  ).toBeNull()

  await selectSolver("SchematicTracePipelineSolver")
  expectDisplayedSolver("SchematicTracePipelineSolver")
})
