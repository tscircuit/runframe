import { expect, test } from "bun:test"
import { shouldShowCrispFeedbackButton } from "../lib/components/CircuitJsonPreview/CrispFeedbackButton"

test("shows Crisp feedback button in the CLI", () => {
  expect(shouldShowCrispFeedbackButton({ isCli: true })).toBe(true)
})

test("hides Crisp feedback button on tscircuit.com", () => {
  expect(shouldShowCrispFeedbackButton({ hostname: "tscircuit.com" })).toBe(
    false,
  )
  expect(
    shouldShowCrispFeedbackButton({
      hostname: "tscircuit.com",
      isCli: true,
    }),
  ).toBe(false)
  expect(shouldShowCrispFeedbackButton({ hostname: "TSCIRCUIT.COM" })).toBe(
    false,
  )
  expect(shouldShowCrispFeedbackButton({ hostname: "app.tscircuit.com" })).toBe(
    false,
  )
})

test("hides Crisp feedback button outside tscircuit.com", () => {
  expect(shouldShowCrispFeedbackButton({ hostname: "localhost" })).toBe(false)
  expect(shouldShowCrispFeedbackButton({ hostname: "example.com" })).toBe(false)
  expect(
    shouldShowCrispFeedbackButton({ hostname: "tscircuit.com.example.com" }),
  ).toBe(false)
})
