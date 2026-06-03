import { afterEach, expect, test } from "bun:test"
import { loadPlatformConfigFromApi } from "../lib/components/RunFrameWithApi/load-platform-config-from-api"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("loadPlatformConfigFromApi decodes RPC-backed platform config functions", async () => {
  const requests: Array<{ url: string; body?: any }> = []

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input.toString()
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    requests.push({ url, body })

    if (url === "/api/dev/runtime-config") {
      return new Response(
        JSON.stringify({
          platformConfig: {
            includeBoardFiles: ["boards/**/*.board.tsx"],
            footprintLibraryMap: {
              ti: {
                __tscircuitDevServerRpcFunction: true,
                target: {
                  type: "path",
                  path: ["footprintLibraryMap", "ti"],
                },
              },
            },
          },
        }),
      )
    }

    if (url === "/api/dev/runtime-config/rpc") {
      return new Response(
        JSON.stringify({
          result: {
            footprintCircuitJson: [
              { type: "source_component", name: body.args[0] },
            ],
          },
        }),
      )
    }

    return new Response("not found", { status: 404 })
  }) as typeof fetch

  const platformConfig = await loadPlatformConfigFromApi(
    "/api/dev/runtime-config",
  )
  const tiLoader = platformConfig?.footprintLibraryMap?.ti as (
    partName: string,
  ) => Promise<{ footprintCircuitJson: any[] }>

  expect(platformConfig?.includeBoardFiles).toEqual(["boards/**/*.board.tsx"])
  expect(typeof tiLoader).toBe("function")
  await expect(tiLoader("MSP430")).resolves.toEqual({
    footprintCircuitJson: [{ type: "source_component", name: "MSP430" }],
  })
  expect(requests[1]).toEqual({
    url: "/api/dev/runtime-config/rpc",
    body: {
      target: {
        type: "path",
        path: ["footprintLibraryMap", "ti"],
      },
      args: ["MSP430"],
    },
  })
})
