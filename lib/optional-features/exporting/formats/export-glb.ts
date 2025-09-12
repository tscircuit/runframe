import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"

export const exportGlb = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  let blob: Blob
  try {
    // Use lower texture resolution for better performance and compatibility
    const glbArrayBuffer = (await convertCircuitJsonToGltf(circuitJson, {
      format: "glb",
      boardTextureResolution: 512,
    })) as ArrayBuffer

    // Ensure we have a valid ArrayBuffer before creating the blob
    if (!glbArrayBuffer || !(glbArrayBuffer instanceof ArrayBuffer)) {
      throw new Error("Invalid GLB data returned from converter")
    }

    blob = new Blob([glbArrayBuffer], {
      type: "model/gltf-binary",
    })
  } catch (error) {
    console.error("GLB Export Error:", error)
    return
  }

  openForDownload(blob, {
    fileName: `${projectName}.glb`,
  })
}
