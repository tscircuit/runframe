import { expect, mock, test } from "bun:test"
import type { PlatformConfig } from "@tscircuit/props"
import { JSDOM } from "jsdom"
import { act } from "react"
import { createRoot } from "react-dom/client"
import { BomTable } from "../../lib/components/BomTable/BomTable"

const createPlatform = (name: string) => {
  const platformFetch = mock(
    async () =>
      new Response(`
    export const convertCircuitJsonToBomRows = async () => [{
      designator: ${JSON.stringify(name)}, comment: "", value: "", footprint: "",
    }]
  `),
  )
  const config: PlatformConfig = {
    jscdnBaseUrl: "/jscdn",
    platformFetch: platformFetch as unknown as typeof fetch,
  }
  return { config, platformFetch }
}

test("BOM previews keep separate platform transports and respond to config changes", async () => {
  const dom = new JSDOM('<div id="root"></div>')
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
  }
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    IS_REACT_ACT_ENVIRONMENT: true,
  })
  const root = createRoot(document.getElementById("root")!)
  const a = createPlatform("STANDALONE_A")
  const b = createPlatform("STANDALONE_B")
  const c = createPlatform("STANDALONE_C")
  const circuitJson = []
  try {
    await act(async () => {
      root.render(
        <>
          <BomTable circuitJson={circuitJson} platformConfig={a.config} />
          <BomTable circuitJson={circuitJson} platformConfig={b.config} />
        </>,
      )
    })
    expect(document.body.textContent).toContain("STANDALONE_A")
    expect(document.body.textContent).toContain("STANDALONE_B")
    expect(a.platformFetch).toHaveBeenCalledWith(
      "/jscdn/circuit-json-to-bom-csv/latest/+esm",
    )
    expect(b.platformFetch).toHaveBeenCalledWith(
      "/jscdn/circuit-json-to-bom-csv/latest/+esm",
    )
    await act(async () => {
      root.render(
        <>
          <BomTable circuitJson={circuitJson} platformConfig={c.config} />
          <BomTable circuitJson={circuitJson} platformConfig={b.config} />
        </>,
      )
    })
    expect(document.body.textContent).toContain("STANDALONE_C")
    expect(document.body.textContent).not.toContain("STANDALONE_A")
    expect(c.platformFetch).toHaveBeenCalledTimes(1)
    expect(b.platformFetch).toHaveBeenCalledTimes(1)
  } finally {
    await act(async () => root.unmount())
    Object.assign(globalThis, previous, { IS_REACT_ACT_ENVIRONMENT: false })
    dom.window.close()
  }
})
