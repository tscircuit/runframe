import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { useEffect } from "react"
import { isFileApiAccessible } from "./utils/isFileApiAccessible.ts"

const mainComponentPath = "analog-simulation-error.circuit.json"

const analogSimulationErrorCircuitJson = JSON.stringify(
  [
    {
      type: "source_component",
      source_component_id: "source_component_0",
      name: "analogsimulation",
      ftype: "simple_analogsimulation",
    },
    {
      type: "simulation_experiment",
      simulation_experiment_id: "simulation_experiment_0",
      name: "spice_transient_analysis",
      experiment_type: "spice_transient_analysis",
      end_time_ms: 10,
      time_per_step: 0.001,
    },
    {
      type: "simulation_unknown_experiment_error",
      simulation_unknown_experiment_error_id:
        "simulation_unknown_experiment_error_0",
      simulation_experiment_id: "simulation_experiment_0",
      error_type: "simulation_unknown_experiment_error",
      message:
        "SPICE simulation failed: timestep too small; transient analysis did not converge",
    },
  ],
  null,
  2,
)

export default () => {
  if (typeof window !== "undefined") {
    window.TSCIRCUIT_DEFAULT_MAIN_COMPONENT_PATH = mainComponentPath
    window.localStorage.setItem("runframe-active-tab", "analog_simulation")

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
    const seedAnalogSimulationErrorFixture = async () => {
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
          text_content: analogSimulationErrorCircuitJson,
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

    seedAnalogSimulationErrorFixture().catch((error) => {
      console.error("Failed to seed analog simulation error fixture", error)
    })
  }, [])

  if (!isFileApiAccessible()) {
    return (
      <div>
        <h1>RunFrameForCli analog simulation error</h1>
        <p>Run this fixture locally so the file API is available.</p>
      </div>
    )
  }

  return <RunFrameForCli debug />
}
