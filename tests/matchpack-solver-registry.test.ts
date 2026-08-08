import { expect, test } from "bun:test"
import { LayoutPipelineSolver } from "@tscircuit/matchpack"
import { RUNFRAME_SOLVERS } from "../lib/components/SolversTabContent/SolversTabContent"

test("includes Matchpack in the Runframe solver registry", () => {
  expect(RUNFRAME_SOLVERS.LayoutPipelineSolver).toBe(LayoutPipelineSolver)
})
