import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { openForDownload } from "../open-for-download"

export const exportGlb = async ({
  circuitJson,
  projectName = "Untitled",
}: {
  circuitJson: CircuitJson
  projectName?: string
}) => {
  const glbBuffer = await convertCircuitJsonToGltf(circuitJson, { format: "glb" })
  const blob = glbBuffer instanceof Blob ? glbBuffer : new Blob([glbBuffer], { type: "model/gltf-binary" })
  openForDownload(blob, {
    fileName: `${projectName}.glb`,
  })
}
