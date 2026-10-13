import type { CircuitJson } from "circuit-json"
import { openForDownload } from "../open-for-download"
import importer from "@tscircuit/internal-dynamic-import"
import { toast } from "lib/utils/toast"

export interface LbrnExportOptions {
  includeSilkscreen?: boolean
  includeOxidationCleaningLayer?: boolean
}

export const exportLbrn = async ({
  circuitJson,
  projectName,
  options = {},
}: {
  circuitJson: CircuitJson
  projectName: string
  options?: LbrnExportOptions
}) => {
  try {
    // Convert Circuit JSON to LBRN format
    const { convertCircuitJsonToLbrn } = await importer("circuit-json-to-lbrn")
    const lbrnProject = await convertCircuitJsonToLbrn(circuitJson, {
      includeSilkscreen: options.includeSilkscreen ?? false,
      includeOxidationCleaningLayer:
        options.includeOxidationCleaningLayer ?? true,
    })

    // Convert to XML string
    const lbrnContent = lbrnProject.toXml()

    // Create blob and trigger download
    const blob = new Blob([lbrnContent], {
      type: "application/lbrn",
    })

    openForDownload(blob, {
      fileName: `${projectName}.lbrn2`,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error"
    toast.error(`Failed to export to LBRN format: ${errorMessage}`)
  }
}
