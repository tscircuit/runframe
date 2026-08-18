import { expect, test } from "bun:test"
import { getSolverConstructorArgs } from "lib/components/SolversTabContent/get-solver-constructor-args"

test("uses exact solver constructor args with legacy fallbacks", () => {
  const exactConstructorArgs = [{ connections: [] }, { buses: [] }] as const
  expect(
    getSolverConstructorArgs({
      solverParams: exactConstructorArgs[0],
      solverConstructorArgs: exactConstructorArgs,
    }),
  ).toBe(exactConstructorArgs)

  const legacyInput = { connections: [] }
  expect(
    getSolverConstructorArgs({
      solverParams: { input: legacyInput, options: { effort: 1 } },
    }),
  ).toEqual([legacyInput])

  const legacyParams = { chips: [] }
  expect(getSolverConstructorArgs({ solverParams: legacyParams })).toEqual([
    legacyParams,
  ])
})
