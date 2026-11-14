import type { AnyCircuitElement } from "circuit-json"
import type { createNgspiceSpiceEngine } from "@tscircuit/ngspice-spice-engine"

// The engine owns a shared WASM instance. Serialize callers across RunFrames.
let queue: Promise<unknown> = Promise.resolve()
let engine: ReturnType<typeof createNgspiceSpiceEngine> | undefined

export const createRunframeNgspiceEngine = (
  getCircuitJson: () => Promise<AnyCircuitElement[]>,
) => ({
  simulate: (source: string) => {
    const pending = queue.then(async () => {
      const { prepareSpiceNetlist } = await import("./prepare-spice-netlist")
      const prepared = await prepareSpiceNetlist(await getCircuitJson(), source)
      engine ??= import("@tscircuit/ngspice-spice-engine")
        .then((module) => module.createNgspiceSpiceEngine())
        .catch((error) => {
          engine = undefined
          throw error
        })
      return (await engine).simulate(prepared)
    })
    queue = pending.catch(() => {})
    return pending
  },
})
