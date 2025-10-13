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
  try {
    // Extract board dimensions from circuit JSON
    const pcbBoard = circuitJson.find((el: any) => el.type === "pcb_board") as any
    
    const boardWidth = pcbBoard?.width ?? 20
    const boardHeight = pcbBoard?.height ?? 15
    const boardThickness = pcbBoard?.thickness ?? 1.6

    // Convert Circuit JSON to STEP format
    const stepText = await circuitJsonToStep(circuitJson, {
      boardWidth,
      boardHeight,
      boardThickness,
      productName: projectName,
      includeComponents: true,
      includeExternalMeshes: true,
    })

    // Create blob and trigger download
    const blob = new Blob([stepText], {
      type: "application/step",
    })

    openForDownload(blob, {
      fileName: `${projectName}.step`,
    })
  } catch (error) {
    console.error("STEP Export Error:", error)
    throw error
  }
}