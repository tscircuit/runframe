import { expect, mock, test } from "bun:test"

test("the shared ngspice instance serializes simulations and recovers from rejection", async () => {
  const events: string[] = []
  let release!: () => void
  mock.module("@tscircuit/ngspice-spice-engine", () => ({
    createNgspiceSpiceEngine: async () => ({
      simulate: async (source: string) => {
        events.push(source)
        if (source === "first")
          await new Promise<void>((resolve) => {
            release = resolve
          })
        if (source === "broken") throw new Error("Circuit not parsed")
        return { simulationResultCircuitJson: [] }
      },
    }),
  }))
  const { createRunframeNgspiceEngine } = await import(
    "../../lib/simulation/create-runframe-ngspice-engine"
  )
  const a = createRunframeNgspiceEngine(async () => [])
  const b = createRunframeNgspiceEngine(async () => [])
  const first = a.simulate("first")
  const second = b.simulate("second")
  for (let i = 0; i < 100 && !release; i++)
    await new Promise((resolve) => setTimeout(resolve, 2))
  expect(events).toEqual(["first"])
  release()
  await Promise.all([first, second])
  expect(events).toEqual(["first", "second"])
  await expect(a.simulate("broken")).rejects.toThrow("Circuit not parsed")
  await expect(b.simulate("recovered")).resolves.toEqual({
    simulationResultCircuitJson: [],
  })
  expect(events).toEqual(["first", "second", "broken", "recovered"])
})
