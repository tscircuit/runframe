import type { CircuitJson } from "circuit-json"
import { exportStep } from "./export-step"

export const exportAssemblyStep = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => exportStep({ circuitJson, projectName, exportMode: "assembly" })
