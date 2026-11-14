import { expect, test } from "bun:test"
import { buildRunFramePrompt } from "../lib/ai/build-runframe-prompt"

test("SPICE and simulation instructions require actual validation and existing viewers", () => {
  const prompt = buildRunFramePrompt({
    task: "component",
    description: "LM358 SOIC-8 voltage follower at 5 V",
    options: ["footprint", "symbol", "spice", "simulation"],
    attachmentNames: ["lm358.pdf"],
  })
  expect(prompt).toContain("LM358 SOIC-8 voltage follower at 5 V")
  expect(prompt).toContain('"lm358.pdf"')
  expect(prompt).toContain("synthesize a behavioral model")
  expect(prompt).toContain("subcircuit pin order")
  expect(prompt).toContain("analog_simulation tab")
  expect(prompt).toContain("never claim an unexecuted simulation passed")
})

test("custom tasks do not acquire unselected component or simulation requirements", () => {
  const prompt = buildRunFramePrompt({
    task: "custom",
    description: "Explain the power rails",
    options: [],
  })
  expect(prompt).toContain("Explain the power rails")
  expect(prompt).not.toContain("Create a PCB footprint")
  expect(prompt).not.toContain("Generate a SPICE model")
  expect(prompt).not.toContain("Build a minimal test circuit")
})
