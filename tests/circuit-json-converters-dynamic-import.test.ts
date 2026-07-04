import { describe, expect, test } from "bun:test"
import { readFileSync, readdirSync } from "node:fs"
import { join, relative } from "node:path"

const sourceDir = join(import.meta.dir, "../lib")

const getSourceFiles = (dir: string): string[] => {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files: string[] = []

  for (const entry of entries) {
    const entryPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      files.push(...getSourceFiles(entryPath))
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      files.push(entryPath)
    }
  }

  return files
}

describe("circuit-json converter imports", () => {
  test("runtime converter imports use the shared dynamic importer", () => {
    const staticRuntimeImports: string[] = []
    const runtimeImportPattern =
      /import\s+(?!type\b)[\s\S]*?\sfrom\s+["']circuit-json-to-[^"']+["']/g

    for (const filePath of getSourceFiles(sourceDir)) {
      const source = readFileSync(filePath, "utf8")
      const matches = source.match(runtimeImportPattern) ?? []

      for (const match of matches) {
        staticRuntimeImports.push(`${relative(sourceDir, filePath)}: ${match}`)
      }
    }

    expect(staticRuntimeImports).toEqual([])
  })
})
