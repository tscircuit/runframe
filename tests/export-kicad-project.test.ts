import { expect, test } from "bun:test"
import { createCircuitWebWorker } from "@tscircuit/eval"
import evalWebWorkerBlobUrl from "@tscircuit/eval/blob-url"
import { createKicadProjectZip } from "lib/optional-features/exporting/formats/export-kicad-project"

const createSimpleCircuitJson = async () => {
  const worker = await createCircuitWebWorker({
    webWorkerUrl: evalWebWorkerBlobUrl,
    verbose: true,
  })

  await worker.executeWithFsMap({
    fsMap: {
      "main.tsx": `
        circuit.add(
          <board width="10mm" height="10mm">
            <resistor name="R1" resistance="1k" footprint="0402" />
            <capacitor name="C1" capacitance="1uF" footprint="0603" />
            <trace from=".R1 .pin1" to=".C1 .pin1" />
          </board>
        )
      `,
    },
    entrypoint: "main.tsx",
  })

  await worker.renderUntilSettled()
  const circuitJson = await worker.getCircuitJson()

  return circuitJson
}

test("createKicadProjectZip generates KiCad schematic and PCB files", async () => {
  const circuitJson = await createSimpleCircuitJson()
  const projectName = "test-project"

  const zip = await createKicadProjectZip({ circuitJson, projectName })

  const schFile = zip.file(`${projectName}.kicad_sch`)
  const pcbFile = zip.file(`${projectName}.kicad_pcb`)

  expect(schFile).toBeDefined()
  expect(pcbFile).toBeDefined()

  const schContent = await schFile?.async("string")
  const pcbContent = await pcbFile?.async("string")

  expect(schContent).toBeTruthy()
  expect(pcbContent).toBeTruthy()
  expect(schContent).toContain("(kicad_sch")
  expect(pcbContent).toContain("(kicad_pcb")
})
