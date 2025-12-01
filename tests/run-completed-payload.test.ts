import { expect, test } from "bun:test"
import { buildRunCompletedPayload } from "../lib/components/RunFrame/run-completion"

const sampleCircuitJsonError = { type: "board_error", message: "trace issue" }

const sampleCircuitJson = [{ type: "board" }, sampleCircuitJsonError]

test("buildRunCompletedPayload includes execution error", () => {
  const payload = buildRunCompletedPayload({
    executionError: new Error("boom"),
  })

  expect(payload.hasExecutionError).toBe(true)
  expect(payload.errors?.[0]).toMatchObject({ message: "boom" })
})

test("buildRunCompletedPayload captures circuit json errors", () => {
  const payload = buildRunCompletedPayload({ circuitJson: sampleCircuitJson })

  expect(payload.hasExecutionError).toBe(false)
  expect(payload.errors).toEqual([sampleCircuitJsonError])
})

test("buildRunCompletedPayload merges execution and circuit errors", () => {
  const payload = buildRunCompletedPayload({
    circuitJson: sampleCircuitJson,
    executionError: "runtime exploded",
  })

  expect(payload.hasExecutionError).toBe(true)
  expect(payload.errors?.length).toBe(2)
  expect(payload.errors?.[0]).toMatchObject({ message: "runtime exploded" })
  expect(payload.errors?.[1]).toEqual(sampleCircuitJsonError)
})
