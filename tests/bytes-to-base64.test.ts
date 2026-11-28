import { expect, test } from "bun:test"
import { bytesToBase64 } from "../lib/utils/bytesToBase64"

test("encodes large byte arrays without exceeding the call stack", () => {
  const bytes = new Uint8Array(1_000_000)
  for (let index = 0; index < bytes.length; index++) {
    bytes[index] = index % 256
  }

  expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"))
})
