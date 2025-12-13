import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import { circuitJsonToStep } from "circuit-json-to-step"
import { toast } from "lib/utils/toast"

/**
 * Transform model_step_url values from local file paths to HTTP URLs.
 * The circuit-json-to-step library requires HTTP(S) URLs to fetch STEP models.
 * This converts local paths to use the file-server's download endpoint.
 */
function transformStepUrlsToHttp(circuitJson: CircuitJson): CircuitJson {
  const apiBase = window.TSCIRCUIT_FILESERVER_API_BASE_URL ?? "/api"

  return circuitJson.map((element) => {
    if (
      element.type === "cad_component" &&
      "model_step_url" in element &&
      typeof element.model_step_url === "string"
    ) {
      const stepUrl = element.model_step_url

      // Skip if already an HTTP URL
      if (/^https?:\/\//i.test(stepUrl)) {
        return element
      }

      // Convert local path to HTTP URL via file-server download endpoint
      const httpUrl = `${window.location.origin}${apiBase}/files/download?file_path=${encodeURIComponent(stepUrl)}`

      return {
        ...element,
        model_step_url: httpUrl,
      }
    }
    return element
  }) as CircuitJson
}

export const exportStep = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  // Extract board dimensions from circuit JSON
  const pcbBoard = circuitJson.find((el) => el.type === "pcb_board")

  const boardWidth =
    pcbBoard && "width" in pcbBoard ? pcbBoard.width : undefined
  const boardHeight =
    pcbBoard && "height" in pcbBoard ? pcbBoard.height : undefined
  const boardThickness =
    pcbBoard && "thickness" in pcbBoard ? pcbBoard.thickness : undefined

  // Validate required dimensions
  if (
    boardWidth === undefined ||
    boardHeight === undefined ||
    boardThickness === undefined
  ) {
    toast.error(
      "Board dimensions not found. Please add a pcb_board with width, height, and thickness to your circuit.",
    )
    return
  }

  // Transform local model_step_url paths to HTTP URLs
  const transformedCircuitJson = transformStepUrlsToHttp(circuitJson)

  // Convert Circuit JSON to STEP format
  let stepText: string
  try {
    stepText = await circuitJsonToStep(transformedCircuitJson, {
      boardWidth,
      boardHeight,
      boardThickness,
      productName: projectName,
      includeComponents: true,
      includeExternalMeshes: true,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    toast.error(`Failed to convert circuit to STEP format: ${errorMessage}`)
    return
  }

  // Create blob and trigger download
  const blob = new Blob([stepText], {
    type: "application/step",
  })

  try {
    openForDownload(blob, {
      fileName: `${projectName}.step`,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    toast.error(`Failed to download STEP file: ${errorMessage}`)
  }
}
