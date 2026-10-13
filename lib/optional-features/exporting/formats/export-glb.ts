import type { PlatformConfig } from "@tscircuit/props"
import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import { getPlatformImporter } from "lib/utils/get-platform-importer"

export const exportGlb = async ({
  circuitJson,
  projectName,
  platformConfig,
}: {
  circuitJson: CircuitJson
  projectName: string
  platformConfig?: PlatformConfig
}) => {
  let blob: Blob
  try {
    const { convertCircuitJsonToGltf } = await getPlatformImporter(
      platformConfig,
    )("circuit-json-to-gltf")

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
