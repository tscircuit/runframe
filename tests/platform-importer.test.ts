import { describe, expect, mock, spyOn, test } from "bun:test"
import importer from "@tscircuit/internal-dynamic-import"
import type { PlatformConfig } from "@tscircuit/props"
import { getPlatformImporter } from "../lib/utils/get-platform-importer"

const bundle = (marker: string) =>
  new Response(
    `export const convertCircuitJsonToPinoutSvg = () => ${JSON.stringify(marker)}`,
    { headers: { "Content-Type": "text/javascript" } },
  )

const createPlatform = (baseUrl: string, marker: string) => {
  const platformFetch = mock(async () => bundle(marker))
  const config: PlatformConfig = {
    jscdnBaseUrl: baseUrl,
    platformFetch: platformFetch as unknown as typeof fetch,
  }
  return { config, platformFetch }
}

describe("platform dynamic imports", () => {
  test("preserves the default importer when no transport is configured", () => {
    expect(getPlatformImporter()).toBe(importer)
    expect(getPlatformImporter({})).toBe(importer)
  })

  test("fetches and executes ESM through platformFetch and revokes its blob URL", async () => {
    const { config, platformFetch } = createPlatform("/jscdn/", "local")
    const revoke = spyOn(URL, "revokeObjectURL")
    try {
      const mod = await getPlatformImporter(config)("circuit-to-svg@0.0.444")
      expect(mod.convertCircuitJsonToPinoutSvg([])).toBe("local")
      expect(platformFetch).toHaveBeenCalledWith(
        "/jscdn/circuit-to-svg/0.0.444/+esm",
      )
      expect(revoke).toHaveBeenCalledTimes(1)
    } finally {
      revoke.mockRestore()
    }
  })

  test("supports an origin-root endpoint without public fallback", async () => {
    const { config, platformFetch } = createPlatform("/", "root")
    await getPlatformImporter(config)("circuit-to-svg")
    expect(platformFetch).toHaveBeenCalledWith("/circuit-to-svg/latest/+esm")
    expect(platformFetch).toHaveBeenCalledTimes(1)
  })

  test("shares concurrent module loads within a configuration", async () => {
    const { config, platformFetch } = createPlatform("/jscdn", "same")
    const load = getPlatformImporter(config)
    const [first, second] = await Promise.all([
      load("circuit-to-svg"),
      load("circuit-to-svg"),
    ])
    expect(first).toBe(second)
    expect(await load("circuit-to-svg")).toBe(first)
    expect(platformFetch).toHaveBeenCalledTimes(1)
  })

  test("isolates modules between viewers even when URLs are identical", async () => {
    const a = createPlatform("/jscdn", "standalone-a")
    const b = createPlatform("/jscdn", "standalone-b")
    const [first, second] = await Promise.all([
      getPlatformImporter(a.config)("circuit-to-svg"),
      getPlatformImporter(b.config)("circuit-to-svg"),
    ])
    expect(first.convertCircuitJsonToPinoutSvg([])).toBe("standalone-a")
    expect(second.convertCircuitJsonToPinoutSvg([])).toBe("standalone-b")
    expect(a.platformFetch).toHaveBeenCalledTimes(1)
    expect(b.platformFetch).toHaveBeenCalledTimes(1)
  })

  test("retains separate cache entries for requested versions", async () => {
    const { config, platformFetch } = createPlatform("/jscdn", "version")
    const load = getPlatformImporter(config)
    await load("circuit-to-svg@0.0.443")
    await load("circuit-to-svg@0.0.444")
    expect(platformFetch.mock.calls.map((args) => args[0])).toEqual([
      "/jscdn/circuit-to-svg/0.0.443/+esm",
      "/jscdn/circuit-to-svg/0.0.444/+esm",
    ])
  })

  test("never falls back from a configured endpoint and allows a failed load to retry", async () => {
    const platformFetch = mock(
      async () => new Response("missing", { status: 404 }),
    )
    const config: PlatformConfig = {
      jscdnBaseUrl: "https://standalone.example/js",
      platformFetch: platformFetch as unknown as typeof fetch,
    }
    const load = getPlatformImporter(config)
    await expect(load("circuit-to-svg")).rejects.toThrow("404")
    expect(platformFetch).toHaveBeenCalledTimes(1)
    expect(platformFetch).toHaveBeenCalledWith(
      "https://standalone.example/js/circuit-to-svg/latest/+esm",
    )
    platformFetch.mockImplementation(async () => bundle("retry"))
    const mod = await load("circuit-to-svg")
    expect(mod.convertCircuitJsonToPinoutSvg([])).toBe("retry")
    expect(platformFetch).toHaveBeenCalledTimes(2)
  })

  test("revokes object URLs and evicts failed module evaluations", async () => {
    const platformFetch = mock(
      async () => new Response("throw new Error('bad bundle')"),
    )
    const config: PlatformConfig = {
      jscdnBaseUrl: "/jscdn",
      platformFetch: platformFetch as unknown as typeof fetch,
    }
    const revoke = spyOn(URL, "revokeObjectURL")
    try {
      const load = getPlatformImporter(config)
      await expect(load("circuit-to-svg")).rejects.toThrow("bad bundle")
      expect(platformFetch).toHaveBeenCalledTimes(1)
      expect(revoke).toHaveBeenCalledTimes(1)
      platformFetch.mockImplementation(async () => bundle("fixed"))
      expect(
        (await load("circuit-to-svg")).convertCircuitJsonToPinoutSvg([]),
      ).toBe("fixed")
      expect(revoke).toHaveBeenCalledTimes(2)
    } finally {
      revoke.mockRestore()
    }
  })

  test("uses platformFetch for online endpoints when only the fetch hook is supplied", async () => {
    const { config, platformFetch } = createPlatform("/unused", "online")
    delete config.jscdnBaseUrl
    await getPlatformImporter(config)("circuit-to-svg")
    expect(platformFetch).toHaveBeenCalledWith(
      "https://jscdn.tscircuit.com/circuit-to-svg/latest/+esm",
    )
  })

  test("does not reuse cached modules after the configuration transport changes", async () => {
    const { config } = createPlatform("/first", "first")
    const first = getPlatformImporter(config)
    await first("circuit-to-svg")
    const next = createPlatform("/second", "second")
    config.jscdnBaseUrl = next.config.jscdnBaseUrl
    config.platformFetch = next.config.platformFetch
    const second = getPlatformImporter(config)
    expect(second).not.toBe(first)
    expect(
      (await second("circuit-to-svg")).convertCircuitJsonToPinoutSvg([]),
    ).toBe("second")
    expect(next.platformFetch).toHaveBeenCalledWith(
      "/second/circuit-to-svg/latest/+esm",
    )
  })

  test("rejects unsupported packages before any transport call", async () => {
    const { config, platformFetch } = createPlatform("/jscdn", "unused")
    await expect(
      getPlatformImporter(config)("untrusted-package"),
    ).rejects.toThrow("Unsupported module")
    expect(platformFetch).not.toHaveBeenCalled()
  })
})
