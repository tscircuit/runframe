import { expect, test } from "bun:test"
import {
  createDatasheetGeneration,
  saveDatasheetGenerationToApi,
  readDatasheetGenerations,
} from "../lib/ai/datasheet-generation"
import {
  addDatasheetToBoard,
  getPlacedDatasheetEntrypoints,
} from "../lib/ai/add-datasheet-to-board"
import { validateDatasheetSource } from "../lib/ai/validate-datasheet-source"
import { generatedCircuitAssets } from "./fixtures/datasheet-ai"

const generation = () =>
  createDatasheetGeneration(generatedCircuitAssets, "family.pdf")

test("saved generations reopen from current files and reject incomplete or unsafe manifests", () => {
  const record = generation()
  const restored = readDatasheetGenerations(record.files)
  expect(restored).toEqual([record])
  const updated = {
    ...record.files,
    [record.directory + "/test123.component.tsx"]:
      "export default () => <chip name='Changed' />",
  }
  expect(
    readDatasheetGenerations(new Map(Object.entries(updated)))[0].assets
      .component!.content,
  ).toContain("Changed")
  const missing = { ...record.files }
  delete missing[record.directory + "/test123.component.tsx"]
  expect(readDatasheetGenerations(missing)).toEqual([])
  for (const transform of [
    () => "{broken",
    (manifest: any) => JSON.stringify({ ...manifest, version: 99 }),
    (manifest: any) =>
      JSON.stringify({
        ...manifest,
        assets: [...manifest.assets, manifest.assets[0]],
      }),
    (manifest: any) =>
      JSON.stringify({
        ...manifest,
        assets: manifest.assets.map((asset: any) => ({
          ...asset,
          filename: "../main.tsx",
        })),
      }),
  ]) {
    const path = record.directory + "/generation.json"
    const files = {
      ...record.files,
      [path]: transform(JSON.parse(record.files[path])),
    }
    expect(readDatasheetGenerations(files)).toEqual([])
  }
})

test("placement detection survives reload, explicit extensions, unused imports and removal", async () => {
  const record = generation()
  const path = record.directory + "/test123.component.tsx"
  const source = `import Existing from "../${path}"; import Unused from "../${record.directory}/test123.reference.tsx"; export default () => <board><Existing name="U1" /></board>`
  expect(
    await getPlacedDatasheetEntrypoints(source, "boards/main.tsx"),
  ).toEqual(new Set([path]))
  expect(
    await getPlacedDatasheetEntrypoints(
      source.replace('<Existing name="U1" />', ""),
      "boards/main.tsx",
    ),
  ).toEqual(new Set())
  expect(
    await addDatasheetToBoard({
      source,
      boardPath: "boards/main.tsx",
      selection: {
        kind: "component",
        generationId: record.id,
        directory: record.directory,
        entrypoint: path,
      },
    }),
  ).toBe(source)
})

test("source review blocks broken selected modules and preserves independent chip use", async () => {
  const assets = structuredClone(generatedCircuitAssets)
  assets.referenceCircuit!.content = "export default () => <group"
  await expect(
    validateDatasheetSource(assets, "component"),
  ).resolves.toBeUndefined()
  await expect(
    validateDatasheetSource(assets, "referenceCircuit"),
  ).rejects.toThrow("test123.reference.tsx")
  assets.component!.content = "export const Chip = () => <chip />"
  await expect(validateDatasheetSource(assets, "component")).rejects.toThrow(
    "default component",
  )
  assets.component!.content =
    'import Missing from "./missing"; export default () => <Missing/>'
  await expect(validateDatasheetSource(assets, "component")).rejects.toThrow(
    "does not resolve",
  )
})

test("each generation saves all artifacts and notes into a unique directory", () => {
  const first = generation(),
    second = generation()
  expect(first.directory).not.toBe(second.directory)
  expect(Object.keys(first.files)).toHaveLength(7)
  expect(
    Object.keys(first.files).every((path) =>
      path.startsWith(first.directory + "/"),
    ),
  ).toBe(true)
  expect(first.files[first.directory + "/test123.simulation.tsx"]).toBe(
    generatedCircuitAssets.simulationCircuit!.content,
  )
  const metadata = JSON.parse(first.files[first.directory + "/generation.json"])
  expect(metadata.id).toBe(first.id)
  expect(metadata.sourceFileName).toBe("family.pdf")
  expect(metadata.warnings).toEqual(generatedCircuitAssets.warnings)
  expect(metadata.assets).toHaveLength(6)
  expect(metadata.assets[0].notes).toBe(generatedCircuitAssets.footprint!.notes)
})

test("file API persistence checks failures and retries the same generation paths", async () => {
  const record = generation(),
    written: string[] = []
  let failure = true
  const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
    expect(String(input)).toBe("http://localhost:3020/api/files/upsert")
    const body = JSON.parse(String(init?.body))
    written.push(body.file_path)
    expect(record.files[body.file_path]).toBe(body.text_content)
    if (failure && written.length === 2)
      return new Response("full", { status: 507 })
    return new Response("{}", { status: 200 })
  }) as typeof fetch
  await expect(
    saveDatasheetGenerationToApi(record, {
      apiBaseUrl: "http://localhost:3020/api/",
      fetch: fetcher,
    }),
  ).rejects.toThrow("507")
  expect(written).toHaveLength(2)
  failure = false
  await saveDatasheetGenerationToApi(record, {
    apiBaseUrl: "http://localhost:3020/api/",
    fetch: fetcher,
  })
  expect(written.slice(2)).toEqual(Object.keys(record.files))
  expect(written.at(-1)).toBe(record.directory + "/generation.json")
})

test("using all three saved outputs appends to the board and is idempotent", async () => {
  const record = generation()
  const original =
    '"use client";\n// Keep this design\nexport default () => <board width="30mm"><resistor name="R1" resistance="1k" footprint="0805" /></board>\n'
  let source = original
  for (const kind of [
    "component",
    "simulationCircuit",
    "referenceCircuit",
  ] as const) {
    const selection = {
      kind,
      generationId: record.id,
      directory: record.directory,
      entrypoint: record.directory + "/" + record.assets[kind]!.filename,
    }
    source = await addDatasheetToBoard({
      source,
      boardPath: "boards/main.tsx",
      selection,
    })
    expect(
      await addDatasheetToBoard({
        source,
        boardPath: "boards/main.tsx",
        selection,
      }),
    ).toBe(source)
  }
  expect(source.startsWith('"use client";')).toBe(true)
  expect(source).toContain("// Keep this design")
  expect(source).toContain('<board width="30mm">')
  expect(source).toContain(
    '<resistor name="R1" resistance="1k" footprint="0805" />',
  )
  expect(source).toContain('from "../generated/')
  for (const name of [
    "GeneratedChip1",
    "GeneratedSimulation1",
    "GeneratedReference1",
  ])
    expect(source).toContain("<" + name)
  expect(source.match(/<group name="Imported/g)).toHaveLength(3)
})

test("another generation adds another instance without reusing earlier file paths", async () => {
  const first = generation(),
    second = generation()
  const select = (g: typeof first) => ({
    kind: "component" as const,
    generationId: g.id,
    directory: g.directory,
    entrypoint: g.directory + "/" + g.assets.component!.filename,
  })
  const source = await addDatasheetToBoard({
    source: "export default () => <board />",
    boardPath: "main.tsx",
    selection: select(first),
  })
  const updated = await addDatasheetToBoard({
    source,
    boardPath: "main.tsx",
    selection: select(second),
  })
  expect(updated).toContain('name="Chip1"')
  expect(updated).toContain('name="Chip2"')
  expect(updated).toContain(first.directory)
  expect(updated).toContain(second.directory)
})

test("an existing unused import is placed, while ambiguous boards are left untouched", async () => {
  const record = generation()
  const selection = {
    kind: "component" as const,
    generationId: record.id,
    directory: record.directory,
    entrypoint: record.directory + "/" + record.assets.component!.filename,
  }
  const source = `import Existing from "./${selection.entrypoint.replace(/\.tsx$/, "")}";\nexport default () => <board/>`
  const result = await addDatasheetToBoard({
    source,
    boardPath: "main.tsx",
    selection,
  })
  expect(result).toContain('<Existing name="Chip1" />')
  expect(result.match(/import Existing/g)).toHaveLength(1)
  const typeOnly = await addDatasheetToBoard({
    source: source.replace("import Existing", "import type Existing"),
    boardPath: "main.tsx",
    selection,
  })
  expect(typeOnly).toContain("import GeneratedChip1 from")
  expect(typeOnly).toContain('<GeneratedChip1 name="Chip1" />')
  for (const invalid of [
    'export default () => <chip name="U1" />',
    "export default () => <><board/><board/></>",
  ]) {
    await expect(
      addDatasheetToBoard({
        source: invalid,
        boardPath: "main.tsx",
        selection,
      }),
    ).rejects.toThrow("one board")
  }
})
