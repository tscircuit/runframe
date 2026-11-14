import { expect, test } from "bun:test"
import { MockLanguageModelV4 } from "ai/test"
import {
  getDatasheetAssetFiles,
  validateDatasheetAssets,
} from "../lib/ai/datasheet-assets"
import {
  MAX_DATASHEET_BYTES,
  generateDatasheetAssets,
} from "../lib/ai/generate-datasheet-assets"
import {
  createDatasheetModel,
  ambiguousAssets,
  generatedAssets,
  modelResponse,
  pdfFile,
} from "./fixtures/datasheet-ai"
import { runIsolatedUiTest } from "./fixtures/run-isolated-ui-test"

test("generates validated assets using the supplied model, PDF bytes and target part", async () => {
  const model = createDatasheetModel()
  const result = await generateDatasheetAssets({
    ai: { model },
    file: pdfFile(),
    targetPart: "TEST123 SOIC-8",
  })
  expect(result).toEqual(generatedAssets)
  expect(getDatasheetAssetFiles(result).map((file) => file.filename)).toEqual([
    "test123.footprint.tsx",
    "test123.symbol.tsx",
  ])
  expect(model.doGenerateCalls).toHaveLength(1)
  const call = model.doGenerateCalls[0]
  expect(call.responseFormat?.type).toBe("json")
  expect(call.prompt[0].role).toBe("system")
  expect(JSON.stringify(call.prompt)).toContain("TEST123 SOIC-8")
  const message = call.prompt.find((message) => message.role === "user")!
  if (message.role !== "user") throw new Error("Expected user prompt")
  const attachment = message.content.find((part) => part.type === "file")!
  expect(attachment.mediaType).toBe("application/pdf")
  expect(attachment.data.type).toBe("data")
  if (attachment.data.type !== "data") throw new Error("Expected PDF bytes")
  expect(attachment.data.data).toBeInstanceOf(Uint8Array)
  expect(new TextDecoder().decode(attachment.data.data)).toContain("%PDF-1.7")
})

test("a blank part yields selectable variants and the same PDF is reused after selection", async () => {
  const model = new MockLanguageModelV4({
    doGenerate: [modelResponse(ambiguousAssets), modelResponse()],
  })
  const file = pdfFile()
  const first = await generateDatasheetAssets({ ai: { model }, file })
  expect(getDatasheetAssetFiles(first)).toHaveLength(0)
  expect(first.clarification?.options).toHaveLength(2)
  const option = first.clarification!.options[0]
  const selected = `${option.partNumber}, ${option.packageName}`
  const second = await generateDatasheetAssets({
    ai: { model },
    file,
    targetPart: selected,
  })
  expect(second).toEqual(generatedAssets)
  expect(second).not.toHaveProperty("clarification")
  const messages = model.doGenerateCalls.map((call) =>
    call.prompt.find((message) => message.role === "user"),
  )
  expect(JSON.stringify(messages[0])).toContain("Not selected")
  expect(JSON.stringify(messages[1])).toContain(selected)
  const attachments = messages.map((message) =>
    message?.role === "user"
      ? message.content.find((part) => part.type === "file")
      : undefined,
  )
  expect(attachments[0]).toEqual(attachments[1])
})

test("rejects invalid, empty and oversized files before invoking the model", async () => {
  const model = createDatasheetModel()
  const invalid = [
    new File(["abc"], "not-a-pdf.txt"),
    new File([], "empty.pdf"),
    new File(["not a PDF"], "fake.pdf"),
    new File([new Uint8Array(MAX_DATASHEET_BYTES + 1)], "large.pdf"),
  ]
  for (const file of invalid) {
    await expect(
      generateDatasheetAssets({ ai: { model }, file }),
    ).rejects.toThrow()
  }
  const abort = new AbortController()
  abort.abort()
  await expect(
    generateDatasheetAssets({
      ai: { model },
      file: pdfFile(),
      abortSignal: abort.signal,
    }),
  ).rejects.toThrow()
  expect(model.doGenerateCalls).toHaveLength(0)
})

test("rejects malformed output and unsafe or conflicting filenames", async () => {
  const invalidResults = [
    { ...generatedAssets, partNumber: 123 },
    {
      ...generatedAssets,
      footprint: { ...generatedAssets.footprint, filename: "../overwrite.tsx" },
    },
    {
      ...generatedAssets,
      footprint: { ...generatedAssets.footprint, filename: "file.exe" },
    },
    {
      ...generatedAssets,
      footprint: { ...generatedAssets.footprint, filename: ".hidden.tsx" },
    },
    {
      ...generatedAssets,
      spiceModel: { ...generatedAssets.footprint, filename: "../model.cir" },
    },
    {
      ...generatedAssets,
      spiceModel: { ...generatedAssets.footprint, filename: "model.tsx" },
    },
    {
      ...generatedAssets,
      symbol: { ...generatedAssets.symbol, filename: "test123.footprint.tsx" },
    },
    {
      ...generatedAssets,
      symbol: { ...generatedAssets.symbol, content: "   " },
    },
  ]
  for (const result of invalidResults) {
    await expect(
      generateDatasheetAssets({
        ai: { model: createDatasheetModel(result) },
        file: pdfFile(),
      }),
    ).rejects.toThrow()
  }
})

test("accepts safe SPICE basenames with every supported extension", () => {
  for (const extension of ["cir", "spice", "lib", "subckt"]) {
    const spiceModel = {
      ...generatedAssets.footprint!,
      filename: `TEST123.model-v1.${extension}`,
    }
    expect(
      validateDatasheetAssets({ ...generatedAssets, spiceModel }).spiceModel,
    ).toEqual(spiceModel)
  }
})

test("cancellation suppresses a late model response", async () => {
  let resolve!: (value: ReturnType<typeof modelResponse>) => void
  const started = Promise.withResolvers<void>()
  const model = new MockLanguageModelV4({
    doGenerate: async () => {
      started.resolve()
      return new Promise((done) => {
        resolve = done
      })
    },
  })
  const abort = new AbortController()
  const pending = generateDatasheetAssets({
    ai: { model },
    file: pdfFile(),
    abortSignal: abort.signal,
  })
  await started.promise
  abort.abort()
  resolve(modelResponse())
  await expect(pending).rejects.toThrow()
})

test("datasheet dialog supports variant selection, review, retry, cancellation and explicit acceptance", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/datasheet-import.tsx", import.meta.url),
  )
}, 20000)

test("the website preview exposes datasheet generation without a File menu", async () => {
  await runIsolatedUiTest(
    new URL("./fixtures/datasheet-website.tsx", import.meta.url),
  )
}, 20000)
