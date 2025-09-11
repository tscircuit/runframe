import { test, expect } from "bun:test"
import { convertCircuitJsonToGltf } from "circuit-json-to-gltf"
import simpleCircuit from "./fixtures/simple-circuit.json" assert { type: "json" }

test("convertCircuitJsonToGltf should convert circuit to GLB", async () => {
  const result = await convertCircuitJsonToGltf(simpleCircuit as any, {
    format: "glb",
  })

  expect(result).toBeInstanceOf(ArrayBuffer)
  expect((result as ArrayBuffer).byteLength).toBeGreaterThan(0)
})
