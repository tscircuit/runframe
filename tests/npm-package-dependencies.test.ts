import { expect, test } from "bun:test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { build } from "tsup"
import packageJson from "../package.json"
import tsupConfig from "../tsup.config"

test("published runtime dependencies exclude GitHub, JSCDN, and pkg.pr.new sources", () => {
  const manifest = packageJson as {
    dependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
  }

  for (const section of [
    "dependencies",
    "optionalDependencies",
    "peerDependencies",
  ] as const) {
    for (const [name, version] of Object.entries(manifest[section] ?? {})) {
      expect(version, `${section}.${name}`).not.toMatch(
        /github:|jscdn\.tscircuit\.com|pkg\.pr\.new/,
      )
    }
  }
})

test("the library build bundles the system viewer and its implementation dependencies", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "runframe-viewer-bundle-"))

  try {
    await build({
      ...tsupConfig,
      entry: {
        viewer: new URL(
          "./fixtures/system-block-viewer-bundle.ts",
          import.meta.url,
        ).pathname,
      },
      outDir,
      format: ["esm"],
      platform: "browser",
      skipNodeModulesBundle: true,
      silent: true,
    })

    const js = await readFile(join(outDir, "viewer.js"), "utf8")
    expect(js).toContain("function SystemBlockViewer(")
    expect(js).not.toMatch(
      /from\s*["'](?:@tscircuit\/system-block-viewer|use-mouse-matrix-transform|transformation-matrix)(?:\/[^"']*)?["']/,
    )
    expect(js).toMatch(/from\s*["']react["']/)
    expect(js).toMatch(/from\s*["']circuit-to-svg["']/)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})
