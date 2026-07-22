import { expect, test } from "bun:test"
import { hasSimulationAnalysisResult } from "lib/utils/has-simulation-analysis-result"

test("recognizes every analog simulation analysis result", () => {
  const resultTypes = [
    "simulation_transient_voltage_graph",
    "simulation_transient_current_graph",
    "simulation_dc_operating_point_voltage",
    "simulation_dc_operating_point_current",
    "simulation_dc_sweep_voltage_graph",
    "simulation_dc_sweep_current_graph",
    "simulation_ac_sweep_voltage_graph",
    "simulation_ac_sweep_current_graph",
  ]

  for (const resultType of resultTypes) {
    expect(hasSimulationAnalysisResult([{ type: resultType }])).toBe(true)
  }
  expect(hasSimulationAnalysisResult([{ type: "simulation_experiment" }])).toBe(
    false,
  )
})
