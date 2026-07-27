import type { AnyCircuitElement } from "circuit-json"
import { isSimulationAnalysisResult } from "circuit-to-svg"

export const hasSimulationAnalysisResult = (
  circuitJson: ReadonlyArray<Pick<AnyCircuitElement, "type">>,
): boolean => circuitJson.some(isSimulationAnalysisResult)
