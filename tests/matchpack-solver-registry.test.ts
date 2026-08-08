import { expect, test } from "bun:test"
import { SOLVERS } from "tscircuit"

test("includes Matchpack in the solver registry", () => {
  expect(SOLVERS.LayoutPipelineSolver).toBeDefined()
})
