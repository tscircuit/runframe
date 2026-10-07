import { expect, test } from "bun:test"
import { gunzipSync, strFromU8 } from "fflate"
import { bytesToBase64 } from "../lib/utils/bytesToBase64"
import { encodeFsMapToUrlHash } from "../lib/utils/encodeFsMapToUrlHash"

test("base64 encoding preserves empty input and every byte", () => {
  expect(bytesToBase64(new Uint8Array())).toBe("")
  const bytes = Uint8Array.from({ length: 256 }, (_, index) => index)
  expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"))
})

test("base64 encoding supports buffers larger than the argument limit", () => {
  const bytes = Uint8Array.from(
    { length: 1024 * 1024 + 1 },
    (_, index) => index % 256,
  )
  expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"))
})

test("large project links preserve every file after gzip/base64 decoding", () => {
  let seed = 123456789
  const sourceLines: string[] = []
  for (let index = 0; index < 150_000; index++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    sourceLines.push(seed.toString(16))
  }
  const fsMap = {
    "board.tsx": "export default () => <board />",
    "fixtures/measurements.txt": sourceLines.join("\n"),
    "notes.txt": "Привет, 世界!",
  }
  const url = encodeFsMapToUrlHash(fsMap)
  const encodedProject = url.split("base64,")[1]!
  const compressedProject = Buffer.from(encodedProject, "base64")
  expect(compressedProject.length).toBeGreaterThan(512 * 1024)
  expect(JSON.parse(strFromU8(gunzipSync(compressedProject)))).toEqual(fsMap)
})
