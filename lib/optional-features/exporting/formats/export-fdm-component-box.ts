import { getDefaultRuntime } from "lib/runtime/default-runtime"
import type { RunFrameRuntime } from "lib/runtime/types"
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
  runtime = getDefaultRuntime(),
): Promise<GeneratedFdmComponentBox> => {
  const { createFdmComponentBox, renderFdmComponentBoxPng } =
    await runtime.modules.load("circuit-json-to-fdm-component-box")
  const [result, previewPng] = await Promise.all([
    createFdmComponentBox(circuitJson),
    renderFdmComponentBoxPng(circuitJson, {}, { width: 960, height: 640 }),
  ])

  return { ...result, previewPng }
}

const generateFdmComponentBox3mf = async (
  circuitJson: CircuitJson,
  runtime = getDefaultRuntime(),
) => {
  const { createFdmComponentBox } = await runtime.modules.load(
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
  runtime = getDefaultRuntime(),
}: {
  circuitJson: CircuitJson
  projectName: string
  runtime?: RunFrameRuntime
}) => {
  await toast.promise(
    (async () => {
      const generatedBox = await generateFdmComponentBox3mf(
        circuitJson,
        runtime,
      )
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
