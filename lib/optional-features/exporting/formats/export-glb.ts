import { getDefaultRuntime } from "lib/runtime/default-runtime"
import type { RunFrameRuntime } from "lib/runtime/types"
import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"

export const exportGlb = async ({
  circuitJson,
  projectName,
  runtime = getDefaultRuntime(),
}: {
  circuitJson: CircuitJson
  projectName: string
  runtime?: RunFrameRuntime
}) => {
  let blob: Blob
  try {
    const { convertCircuitJsonToGltf } = await runtime.modules.load(
      "circuit-json-to-gltf",
    )

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
