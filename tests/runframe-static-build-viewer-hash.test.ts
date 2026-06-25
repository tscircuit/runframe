import { expect, test } from "bun:test"
import {
  getInitialCircuitJsonPath,
  getUpdatedCircuitJsonPathHash,
} from "../lib/components/RunFrameStaticBuildViewer/use-static-circuit-json-path-hash"

test("RunFrameStaticBuildViewer reads file from hash", () => {
  expect(
    getInitialCircuitJsonPath({
      hash: "#file=index.circuit.tsx&main_component=TEST.circuit.tsx",
    }),
  ).toBe("index.circuit.tsx")
})

test("RunFrameStaticBuildViewer falls back to main_component from hash", () => {
  expect(
    getInitialCircuitJsonPath({
      hash: "#main_component=index.circuit.tsx",
    }),
  ).toBe("index.circuit.tsx")
})

test("RunFrameStaticBuildViewer updates file hash", () => {
  expect(
    getUpdatedCircuitJsonPathHash({
      hash: "#tab=schematic&file=TEST.circuit.tsx",
      filePath: "index.circuit.tsx",
    }),
  ).toBe("#tab=schematic&file=index.circuit.tsx")
})
