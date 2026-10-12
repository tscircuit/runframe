import { expect, test } from "bun:test"
import { setDynamicImportResolver } from "@tscircuit/internal-dynamic-import"
import { resolveConfig } from "vite"
import config from "../vite.config"
import { loadRunFrameModule } from "../lib/optional-features/importing/load-runframe-module"
import { fileURLToPath } from "node:url"

test("regular RunFrame uses the dynamic importer with the supplied resolver", async () => {
  const previousResolver = globalThis.tscircuitDynamicImportResolver
  const requests: string[] = []
  const fakeModule = { source: "fake dynamic module" }
  setDynamicImportResolver((specifier) => {
    requests.push(specifier)
    return fakeModule
  })
  try {
    expect(await loadRunFrameModule("circuit-json-to-gerber")).toBe(fakeModule)
    expect(requests).toEqual(["circuit-json-to-gerber"])
  } finally {
    setDynamicImportResolver(previousResolver)
  }
})

test("Vite resolves the bundled loader only for standalone entrypoints", async () => {
  const previousMode = process.env.STANDALONE
  try {
    for (const mode of [undefined, "iframe", "1", "preview"]) {
      if (mode === undefined) delete process.env.STANDALONE
      else process.env.STANDALONE = mode
      const appConfig = await config({ command: "build", mode: "production" })
      const resolved = await resolveConfig(
        { ...appConfig, configFile: false },
        "build",
      )
      const loader = await resolved.createResolver()(
        "lib/optional-features/importing/load-runframe-module",
      )
      const standalone = mode === "1" || mode === "preview"
      expect(loader).toBe(
        fileURLToPath(
          new URL(
            `../lib/optional-features/importing/${standalone ? "load-bundled-runframe-module" : "load-runframe-module"}.ts`,
            import.meta.url,
          ),
        ),
      )
    }
  } finally {
    if (previousMode === undefined) delete process.env.STANDALONE
    else process.env.STANDALONE = previousMode
  }
}, 20000)
