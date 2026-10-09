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
  test("static converter imports are confined to the offline provider", () => {
    const staticRuntimeImports: string[] = []
    const scanner = new Bun.Transpiler({ loader: "tsx" })

    for (const filePath of getSourceFiles(sourceDir)) {
      if (relative(sourceDir, filePath) === "runtime/offline.ts") continue
      const source = readFileSync(filePath, "utf8")
      for (const dependency of scanner.scanImports(source)) {
        if (
          dependency.kind === "import-statement" &&
          dependency.path.startsWith("circuit-json-to-")
        ) {
          staticRuntimeImports.push(
            `${relative(sourceDir, filePath)}: ${dependency.path}`,
          )
        }
      }
    }

    expect(staticRuntimeImports).toEqual([])
  })

  test("the CDN importer is confined to the online adapter", () => {
    const violations: string[] = []
    const scanner = new Bun.Transpiler({ loader: "tsx" })
    for (const filePath of getSourceFiles(sourceDir)) {
      if (relative(sourceDir, filePath) === "runtime/online.ts") continue
      if (
        scanner
          .scanImports(readFileSync(filePath, "utf8"))
          .some(
            (dependency) =>
              dependency.path === "@tscircuit/internal-dynamic-import",
          )
      ) {
        violations.push(relative(sourceDir, filePath))
      }
    }
    expect(violations).toEqual([])
  })

  test("the FDM component box converter is an available lazy accessory", async () => {
    const { availableAccessoryExports, availableExports } = await import(
      "../lib/optional-features/exporting/export-and-download"
    )

    expect(availableExports).not.toContainEqual({
      extension: "3mf",
      name: "Component Box (3MF)",
    })
    expect(availableAccessoryExports).toContainEqual({
      extension: "3mf",
      name: "Component Box (3MF)",
    })
  })
})
