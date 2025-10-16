import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import { circuitJsonToStep } from "circuit-json-to-step"
import { toast } from "lib/utils/toast"

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

  // Convert Circuit JSON to STEP format
  let stepText: string
  try {
    stepText = await circuitJsonToStep(circuitJson, {
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
