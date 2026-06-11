import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

const mainComponentPath = "slow-analog-sim.circuit.tsx"

const slowAnalogSimulationCircuit = `
export default () => (
  <board width="48mm" height="22mm" routingDisabled schMaxTraceDistance={10}>
    <voltagesource name="V1" voltage="5V" schX={-5} schY={0} />
    <resistor name="R1" resistance="1k" footprint="0402" schX={-3} schY={0} />
    <capacitor name="C1" capacitance="1uF" footprint="0402" schX={-1} schY={-1.6} />
    <resistor name="R2" resistance="1k" footprint="0402" schX={0.8} schY={0} />
    <capacitor name="C2" capacitance="1uF" footprint="0402" schX={2.6} schY={-1.6} />
    <resistor name="R3" resistance="1k" footprint="0402" schX={4.4} schY={0} />
    <capacitor name="C3" capacitance="1uF" footprint="0402" schX={6.2} schY={-1.6} />

    <trace from=".V1 > .pin1" to=".R1 > .pin1" />
    <trace from=".R1 > .pin2" to=".C1 > .pin1" />
    <trace from=".C1 > .pin1" to=".R2 > .pin1" />
    <trace from=".R2 > .pin2" to=".C2 > .pin1" />
    <trace from=".C2 > .pin1" to=".R3 > .pin1" />
    <trace from=".R3 > .pin2" to=".C3 > .pin1" />

    <trace from=".V1 > .pin2" to=".C1 > .pin2" />
    <trace from=".V1 > .pin2" to=".C2 > .pin2" />
    <trace from=".V1 > .pin2" to=".C3 > .pin2" />

    <voltageprobe name="VP_IN" connectsTo=".V1 > .pin1" />
    <voltageprobe name="VP_STAGE_1" connectsTo=".C1 > .pin1" />
    <voltageprobe name="VP_STAGE_2" connectsTo=".C2 > .pin1" />
    <voltageprobe name="VP_OUT" connectsTo=".C3 > .pin1" />

    <analogsimulation
      name="slow_transient"
      duration="200ms"
      timePerStep="100ns"
      spiceEngine="ngspice"
    />
  </board>
)
`.trim()

export default () => {
  if (typeof window !== "undefined") {
    window.TSCIRCUIT_DEFAULT_MAIN_COMPONENT_PATH = mainComponentPath
    const params = new URLSearchParams(window.location.hash.slice(1))
    params.set("file", mainComponentPath)
    params.set("main_component", mainComponentPath)
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}#${params}`,
    )
  }

  useEffect(() => {
    const seedSlowAnalogSimulationFixture = async () => {
      await fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: mainComponentPath,
          text_content: slowAnalogSimulationCircuit,
        }),
      })

      await fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "manual-edits.json",
          text_content: JSON.stringify({}),
        }),
      })

      await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_type: "INITIAL_FILES_UPLOADED",
          file_count: 2,
        }),
      })
    }

    seedSlowAnalogSimulationFixture().catch((error) => {
      console.error("Failed to seed slow analog simulation fixture", error)
    })
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>RunFrameForCli slow analog simulation</h1>
        <p>Run this fixture locally so the file API is available.</p>
      </div>
    )
  }

  return <RunFrameForCli debug />
}
