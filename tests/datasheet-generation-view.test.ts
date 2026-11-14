import { expect, test } from "bun:test"
import { createDatasheetGeneration } from "../lib/ai/datasheet-generation"
import { getGenerationViews } from "../lib/components/DatasheetImportDialog/generation-view"
import { generatedCircuitAssets } from "./fixtures/datasheet-ai"

test("restored use states follow the active board and re-enable after removal", () => {
  const generation = createDatasheetGeneration(
    generatedCircuitAssets,
    "test.pdf",
  )
  const path =
    generation.directory + "/" + generation.assets.component!.filename
  const placement = {
    boardPath: "main.tsx",
    source: "before",
    entrypoints: new Set<string>(),
  }
  const local = [
    {
      generation,
      saved: true,
      added: new Set(["component"] as const),
      addedIn: { boardPath: "main.tsx", source: "before" },
    },
  ]
  expect(
    getGenerationViews([generation], local, placement)[0].added.has(
      "component",
    ),
  ).toBe(true)
  expect(
    getGenerationViews([generation], [], {
      ...placement,
      source: "after",
      entrypoints: new Set([path]),
    })[0].added.has("component"),
  ).toBe(true)
  expect(
    getGenerationViews([generation], local, {
      ...placement,
      source: "removed",
    })[0].added.size,
  ).toBe(0)
  expect(
    getGenerationViews([generation], local, {
      ...placement,
      boardPath: "other.tsx",
    })[0].added.size,
  ).toBe(0)
})

test("current filesystem sources replace cached results while unsaved results remain retryable", () => {
  const generation = createDatasheetGeneration(
    generatedCircuitAssets,
    "test.pdf",
  )
  const unsaved = createDatasheetGeneration(
    generatedCircuitAssets,
    "another.pdf",
  )
  const current = {
    ...generation,
    assets: {
      ...generation.assets,
      component: { ...generation.assets.component!, content: "edited source" },
    },
  }
  const views = getGenerationViews(
    [current],
    [
      { generation, saved: true, added: new Set() },
      { generation: unsaved, saved: false, added: new Set() },
    ],
  )
  expect(views).toHaveLength(2)
  expect(
    views.find((v) => v.generation.id === generation.id)?.generation.assets
      .component?.content,
  ).toBe("edited source")
  expect(views.find((v) => v.generation.id === unsaved.id)?.saved).toBe(false)
})
