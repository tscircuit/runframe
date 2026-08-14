import { expect, test } from "bun:test"
import {
  getInitialCircuitJsonPath,
  getUpdatedCircuitJsonPathHash,
  hasGalleryFlag,
} from "../lib/components/RunFrameStaticBuildViewer/use-static-circuit-json-path-hash"
import { getCircuitPreviewImageUrls } from "../lib/components/RunFrameStaticBuildViewer/CircuitGallery"

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

test("RunFrameStaticBuildViewer opens the gallery from the hash or query", () => {
  expect(hasGalleryFlag({ hash: "#gallery" })).toBe(true)
  expect(hasGalleryFlag({ hash: "#gallery=true" })).toBe(true)
  expect(hasGalleryFlag({ hash: "", search: "?gallery=1" })).toBe(true)
  expect(hasGalleryFlag({ hash: "#gallery=false" })).toBe(false)
})

test("selecting a circuit removes the gallery flag", () => {
  expect(
    getUpdatedCircuitJsonPathHash({
      hash: "#gallery=true&tab=cad",
      filePath: "boards/led.board.tsx",
    }),
  ).toBe("#tab=cad&file=boards%2Fled.board.tsx")

  expect(
    getUpdatedCircuitJsonPathHash({
      hash: "#file=boards%2Fled.board.tsx&gallery=true",
      filePath: "boards/led.board.tsx",
    }),
  ).toBe("#file=boards%2Fled.board.tsx")
})

test("gallery preview images are derived from dist circuit JSON assets", () => {
  expect(
    getCircuitPreviewImageUrls({
      filePath: "boards/led.board.tsx",
      fileStaticAssetUrl: "./boards/led/circuit.json?v=2",
    }),
  ).toEqual([
    "./boards/led/3d.png?v=2",
    "./boards/led/pcb.png?v=2",
    "./boards/led/pcb.svg?v=2",
    "./boards/led/schematic.png?v=2",
    "./boards/led/schematic.svg?v=2",
  ])
})
