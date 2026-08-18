import { expect, test } from "bun:test"
import { SOLVERS } from "@tscircuit/core"

test("includes FanoutSolver in the solver registry", () => {
  expect(SOLVERS.FanoutSolver).toBeDefined()
})
