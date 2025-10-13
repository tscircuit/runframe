import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import { circuitJsonToStep } from "circuit-json-to-step"

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
    (pcbBoard && "width" in pcbBoard ? pcbBoard.width : undefined) ?? 20
  const boardHeight =
    (pcbBoard && "height" in pcbBoard ? pcbBoard.height : undefined) ?? 15
  const boardThickness =
    (pcbBoard && "thickness" in pcbBoard ? pcbBoard.thickness : undefined) ??
    1.6

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
    console.error("STEP conversion error:", error)
    throw error
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
    console.error("STEP download error:", error)
    throw error
  }
}
