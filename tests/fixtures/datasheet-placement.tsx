import { expect, test } from "bun:test"
import { CircuitRunner } from "@tscircuit/eval"
import { addDatasheetToBoard } from "../../lib/ai/add-datasheet-to-board"

test("importing chips into a sized board uses native placement and preserves existing positions", async () => {
  let source =
    'export default () => <board width="30mm" height="30mm" routingDisabled><resistor name="R1" resistance="1k" footprint="0805" pcbX={-6} pcbY={4}/></board>'
  const files: Record<string, string> = {}
  for (let index = 0; index < 3; index++) {
    const path = `generated/test-${index}/chip.tsx`
    files[path] =
      `export default (props) => <chip {...props} pinLabels={{pin1:"A",pin2:"B"}} footprint={<footprint><smtpad portHints={["1"]} pcbX={-1} pcbY={0} width={0.6} height={1} shape="rect"/><smtpad portHints={["2"]} pcbX={1} pcbY={0} width={0.6} height={1} shape="rect"/></footprint>}/>`
    source = await addDatasheetToBoard({
      source,
      boardPath: "main.tsx",
      selection: {
        kind: "component",
        generationId: String(index),
        directory: `generated/test-${index}`,
        entrypoint: path,
      },
    })
  }
  files["main.tsx"] = source
  const runner = new CircuitRunner({
    projectConfig: {
      partsEngineDisabled: true,
      enablePartOrientationAnalysis: false,
    },
  })
  await runner.executeWithFsMap({ fsMap: files, mainComponentPath: "main.tsx" })
  await runner.renderUntilSettled()
  const json = await runner.getCircuitJson()
  expect(json.filter((e) => e.type.endsWith("_error"))).toEqual([])
  expect(json.filter((e) => e.type === "pcb_component")).toHaveLength(4)
  const resistor = json.find(
    (e) => e.type === "source_component" && e.name === "R1",
  )!
  expect(
    json.find(
      (e) =>
        e.type === "pcb_component" &&
        e.source_component_id === (resistor as any).source_component_id,
    ),
  ).toMatchObject({ center: { x: -6, y: 4 } })
})
