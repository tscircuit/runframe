const simulationAnalysisResultTypes = new Set([
  "simulation_transient_voltage_graph",
  "simulation_transient_current_graph",
  "simulation_dc_operating_point_voltage",
  "simulation_dc_operating_point_current",
  "simulation_dc_sweep_voltage_graph",
  "simulation_dc_sweep_current_graph",
  "simulation_ac_sweep_voltage_graph",
  "simulation_ac_sweep_current_graph",
])

export const hasSimulationAnalysisResult = (
  circuitJson: Array<{ type: string }>,
): boolean =>
  circuitJson.some((element) => simulationAnalysisResultTypes.has(element.type))
