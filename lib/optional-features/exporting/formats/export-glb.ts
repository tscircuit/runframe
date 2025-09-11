import type { CircuitJson } from "circuit-json"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import { openForDownload } from "../open-for-download"

export const exportGlb = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  const glbArrayBuffer = (await convertCircuitJsonToGltf(circuitJson, {
    format: "glb",
  })) as ArrayBuffer

  const blob = new Blob([glbArrayBuffer], {
    type: "model/gltf-binary",
  })

  openForDownload(blob, {
    fileName: `${projectName}.glb`,
  })
}
