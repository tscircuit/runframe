import { expect, test } from "bun:test"
import { renderToStaticMarkup } from "react-dom/server"
import {
  useCircuitJsonFile,
  type UseCircuitJsonFileOptions,
  type UseCircuitJsonFileResult,
} from "../lib/hooks/use-circuit-json-file"

const readCircuitJsonFile = (options: UseCircuitJsonFileOptions) => {
  let result: UseCircuitJsonFileResult | undefined
  function Probe() {
    result = useCircuitJsonFile(options)
    return null
  }
  renderToStaticMarkup(<Probe />)
  if (!result) throw new Error("Hook did not render")
  return result
}

test.each(["null", "{}", '"board"', "0", "false"])(
  "reports non-array circuit JSON %s as a file error",
  (content) => {
    const result = readCircuitJsonFile({
      mainComponentPath: "board.circuit.json",
      fsMap: new Map([["board.circuit.json", content]]),
    })
    expect(result.isStaticCircuitJson).toBe(true)
    expect(result.circuitJson).toBeNull()
    expect(result.error).toContain("Expected an array of circuit elements")
  },
)

test.each(["[null]", "[42]", "[[]]", "[{}]", '[{"type":false}]'])(
  "reports invalid circuit element in %s as a file error",
  (content) => {
    const result = readCircuitJsonFile({
      mainComponentPath: "board.circuit.json",
      fsMap: new Map([["board.circuit.json", content]]),
    })
    expect(result.circuitJson).toBeNull()
    expect(result.error).toContain("Invalid circuit element at index 0")
  },
)

test("accepts an empty circuit and preserves elements from newer schemas", () => {
  for (const content of [
    "[]",
    '[{"type":"source_net","source_net_id":"net_1","name":"GND"}]',
    '[{"type":"future_element","custom":1}]',
  ]) {
    expect(
      readCircuitJsonFile({
        mainComponentPath: "circuit.json",
        fsMap: new Map([["circuit.json", content]]),
      }),
    ).toEqual({
      isStaticCircuitJson: true,
      circuitJson: JSON.parse(content),
      error: null,
    })
  }
})

test("distinguishes an empty file from a missing file", () => {
  const result = readCircuitJsonFile({
    mainComponentPath: "circuit.json",
    fsMap: new Map([["circuit.json", ""]]),
  })
  expect(result.circuitJson).toBeNull()
  expect(result.error).toContain("Failed to parse circuit.json")
  expect(result.error).not.toContain("not found")
})

test("reports missing files and ignores TypeScript entrypoints", () => {
  expect(
    readCircuitJsonFile({
      mainComponentPath: "circuit.json",
      fsMap: new Map(),
    }).error,
  ).toBe("Circuit JSON file not found: circuit.json")
  expect(
    readCircuitJsonFile({
      mainComponentPath: "board.tsx",
      fsMap: new Map([["board.tsx", "not JSON"]]),
    }),
  ).toEqual({ isStaticCircuitJson: false, circuitJson: null, error: null })
})
