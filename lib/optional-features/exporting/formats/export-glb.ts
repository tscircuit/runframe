import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import { loadGltfConverter } from "../dynamic-converters"

export const exportGlb = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  let blob: Blob
  try {
    const { convertCircuitJsonToGltf } = await loadGltfConverter()

    console.log("convertCircuitJsonToGltf", convertCircuitJsonToGltf)

    const glbArrayBuffer = (await convertCircuitJsonToGltf(circuitJson, {
      format: "glb",
      boardTextureResolution: 1024,
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
