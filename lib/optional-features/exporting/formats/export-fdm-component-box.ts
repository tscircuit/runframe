import importer from "@tscircuit/internal-dynamic-import"
import type { CircuitJson } from "circuit-json"
import { sanitizeFileName } from "lib/utils/sanitizeFileName"
import { toast } from "lib/utils/toast"
import { openForDownload } from "../open-for-download"

export interface GeneratedFdmComponentBox {
  threeMf: Uint8Array
  previewPng: Uint8Array
  componentRefdes: string[]
  dimensions: {
    width: number
    depth: number
    height: number
    columns: number
    rows: number
  }
  compartments: Array<unknown>
}

export const generateFdmComponentBox = async (
  circuitJson: CircuitJson,
): Promise<GeneratedFdmComponentBox> => {
  const { createFdmComponentBox, renderFdmComponentBoxPng } = await importer(
    "circuit-json-to-fdm-component-box",
  )
  const [result, previewPng] = await Promise.all([
    createFdmComponentBox(circuitJson),
    renderFdmComponentBoxPng(circuitJson, {}, { width: 960, height: 640 }),
  ])

  return { ...result, previewPng }
}

const generateFdmComponentBox3mf = async (circuitJson: CircuitJson) => {
  const { createFdmComponentBox } = await importer(
    "circuit-json-to-fdm-component-box",
  )
  return createFdmComponentBox(circuitJson)
}

export const downloadFdmComponentBox = ({
  generatedBox,
  projectName,
}: {
  generatedBox: Pick<GeneratedFdmComponentBox, "threeMf">
  projectName: string
}) => {
  const bytes = Uint8Array.from(generatedBox.threeMf)
  openForDownload(new Blob([bytes.buffer], { type: "model/3mf" }), {
    fileName: `${sanitizeFileName(projectName)}-component-box.3mf`,
  })
}

export const exportFdmComponentBox = async ({
  circuitJson,
  projectName,
}: {
  circuitJson: CircuitJson
  projectName: string
}) => {
  await toast.promise(
    (async () => {
      const generatedBox = await generateFdmComponentBox3mf(circuitJson)
      downloadFdmComponentBox({
        generatedBox,
        projectName,
      })
    })(),
    {
      loading: "Generating component box...",
      success: "Component box 3MF ready",
      error: (error) =>
        `Failed to generate component box: ${
          error instanceof Error ? error.message : String(error)
        }`,
    },
  )
}
