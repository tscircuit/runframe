import type { AnyCircuitElement } from "circuit-json"

const simulationAnalysisResultTypes = [
  "simulation_transient_voltage_graph",
  "simulation_transient_current_graph",
  "simulation_dc_operating_point_voltage",
  "simulation_dc_operating_point_current",
  "simulation_dc_sweep_voltage_graph",
  "simulation_dc_sweep_current_graph",
  "simulation_ac_sweep_voltage_graph",
  "simulation_ac_sweep_current_graph",
] as const satisfies ReadonlyArray<AnyCircuitElement["type"]>

export const hasSimulationAnalysisResult = (
  circuitJson: ReadonlyArray<Pick<AnyCircuitElement, "type">>,
): boolean =>
  circuitJson.some((circuitElement) =>
    simulationAnalysisResultTypes.some(
      (simulationAnalysisResultType) =>
        circuitElement.type === simulationAnalysisResultType,
    ),
  )
