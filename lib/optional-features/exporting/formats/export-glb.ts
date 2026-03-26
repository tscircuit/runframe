import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"

const CIRCUIT_JSON_TO_GLTF_URL =
  "https://cdn.jsdelivr.net/npm/circuit-json-to-gltf@latest/dist/index.js"

type CircuitJsonToGltfModule = {
  convertCircuitJsonToGltf: (
    circuitJson: CircuitJson,
    options?: {
      format?: "gltf" | "glb"
      boardTextureResolution?: number
    },
  ) => Promise<ArrayBuffer | Uint8Array>
}

let circuitJsonToGltfPromise: Promise<CircuitJsonToGltfModule> | null = null

const loadCircuitJsonToGltf = async (): Promise<CircuitJsonToGltfModule> => {
  if (!circuitJsonToGltfPromise) {
    circuitJsonToGltfPromise = import(
      /* @vite-ignore */ CIRCUIT_JSON_TO_GLTF_URL
    ) as Promise<CircuitJsonToGltfModule>
  }

  return circuitJsonToGltfPromise
}

export const exportGlb = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  let blob: Blob
  try {
    const { convertCircuitJsonToGltf } = await loadCircuitJsonToGltf()

    // Use lower texture resolution for better performance and compatibility
    const glbResult = await convertCircuitJsonToGltf(circuitJson, {
      format: "glb",
      boardTextureResolution: 512,
    })

    const glbArrayBuffer =
      glbResult instanceof Uint8Array
        ? glbResult.buffer.slice(
            glbResult.byteOffset,
            glbResult.byteOffset + glbResult.byteLength,
          )
        : glbResult

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
