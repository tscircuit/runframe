import { expect, test } from "bun:test"
import { SOLVERS, type SimpleRouteJson } from "@tscircuit/core"
import { getSolverConstructorArgs } from "lib/components/SolversTabContent/get-solver-constructor-args"

const solverName = "AutoroutingPipelineSolver9_PreloadedTraceGraph"
const SolverClass = SOLVERS[solverName]
const input: SimpleRouteJson = {
  layerCount: 2,
  minTraceWidth: 0.15,
  obstacles: [],
  connections: [
    {
      name: "VCC",
      pointsToConnect: [
        { x: -1, y: 0, layer: "top" },
        { x: 1, y: 0, layer: "top" },
      ],
    },
  ],
  bounds: { minX: -2, maxX: 2, minY: -2, maxY: 2 },
}

for (const includeConstructorArgs of [true, false]) {
  const eventField = includeConstructorArgs
    ? "solverConstructorArgs"
    : "solverParams"

  test(`replays Pipeline9 from wrapped ${eventField}`, () => {
    const solverParams = {
      input: structuredClone(input),
      options: { effort: 2 },
    }
    const constructorArgs = getSolverConstructorArgs({
      solverName,
      solverParams,
      ...(includeConstructorArgs
        ? { solverConstructorArgs: [solverParams] }
        : {}),
    })

    const solver: InstanceType<typeof SolverClass> = Reflect.construct(
      SolverClass,
      [...constructorArgs],
    )
    expect(solver.getSolverName()).toBe(solverName)
    expect(constructorArgs).toHaveLength(2)
    expect(constructorArgs[0]).toBe(solverParams.input)
    expect(constructorArgs[1]).toBe(solverParams.options)
    expect(() => solver.visualize()).not.toThrow()
  })
}

test("preserves an exact Pipeline9 constructor tuple", () => {
  const exactConstructorArgs = [structuredClone(input), { effort: 2 }] as const
  const constructorArgs = getSolverConstructorArgs({
    solverName,
    solverParams: { input: {}, options: {} },
    solverConstructorArgs: exactConstructorArgs,
  })

  expect(constructorArgs).toBe(exactConstructorArgs)
  expect(() =>
    Reflect.construct(SolverClass, [...constructorArgs]),
  ).not.toThrow()
})

test("does not unpack another solver's one-object constructor", () => {
  const exactConstructorArgs = [{ input: {}, options: {} }] as const
  expect(
    getSolverConstructorArgs({
      solverName: "LayoutPipelineSolver",
      solverParams: exactConstructorArgs[0],
      solverConstructorArgs: exactConstructorArgs,
    }),
  ).toBe(exactConstructorArgs)
})

test("keeps malformed Pipeline9 input errors visible", () => {
  const solverParams = {
    input: { ...input, obstacles: undefined },
    options: { effort: 2 },
  }
  const constructorArgs = getSolverConstructorArgs({
    solverName,
    solverParams,
    solverConstructorArgs: [solverParams],
  })

  expect(() => Reflect.construct(SolverClass, [...constructorArgs])).toThrow(
    TypeError,
  )
})
