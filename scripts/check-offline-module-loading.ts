import assert from "node:assert/strict"
import JSZip from "jszip"
import { chromium } from "playwright"

const bundle = Bun.file("dist/standalone-offline.min.js")
if (!(await bundle.exists())) throw new Error("Run bun run build:offline first")

const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    if (new URL(request.url).pathname === "/offline.js") {
      return new Response(bundle, {
        headers: { "content-type": "text/javascript; charset=utf-8" },
      })
    }
    return new Response('<script src="/offline.js"></script>', {
      headers: { "content-type": "text/html; charset=utf-8" },
    })
  },
})
const origin = `http://127.0.0.1:${server.port}`
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
})

try {
  const context = await browser.newContext({ serviceWorkers: "block" })
  const publicRequests: string[] = []
  const errors: string[] = []
  await context.route("**/*", async (route) => {
    const url = route.request().url()
    if (new URL(url).origin === origin) return route.continue()
    publicRequests.push(url)
    await route.abort("internetdisconnected")
  })
  const page = await context.newPage()
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto(origin)
  assert.deepEqual(errors, [], "Offline bundle failed during initialization")
  const modules = await page.evaluate(async () => {
    const api = (window as any).RunframeOffline
    const runtime = api.createOfflineRuntime()
    const names = [
      "circuit-json-to-gerber",
      "circuit-json-to-bom-csv",
      "circuit-json-to-pnp-csv",
      "circuit-json-to-kicad",
      "circuit-json-to-gltf",
      "circuit-json-to-step",
      "circuit-json-to-lbrn",
      "circuit-json-to-fdm-component-box",
      "circuit-to-svg",
      "kicad-to-circuit-json",
      "circuit-json-to-altium",
      "easyeda",
    ]
    for (const name of names) {
      const module = await runtime.modules.load(name)
      if (!module || Object.keys(module).length === 0)
        throw new Error(`Missing ${name}`)
    }
    return names
  })
  const downloadPromise = page.waitForEvent("download")
  await page.evaluate(async () => {
    const api = (window as any).RunframeOffline
    await api.exportAndDownload({
      runtime: api.createOfflineRuntime(),
      exportName: "Fabrication Files",
      projectName: "offline-board",
      circuitJson: [
        {
          type: "pcb_board",
          pcb_board_id: "board1",
          center: { x: 0, y: 0 },
          width: 10,
          height: 10,
          num_layers: 2,
          material: "fr4",
          thickness: 1.6,
        },
        {
          type: "source_component",
          source_component_id: "source1",
          name: "R1",
          ftype: "simple_resistor",
          resistance: 1000,
        },
        {
          type: "pcb_component",
          pcb_component_id: "pcb1",
          source_component_id: "source1",
          pcb_board_id: "board1",
          center: { x: 0, y: 0 },
          width: 2,
          height: 1.2,
          rotation: 0,
          layer: "top",
        },
      ],
    })
  })
  const download = await downloadPromise
  assert.equal(
    download.suggestedFilename(),
    "offline-board_fabrication_files.zip",
  )
  const path = await download.path()
  assert(path)
  const zip = await JSZip.loadAsync(await Bun.file(path).arrayBuffer())
  assert((await zip.file("bom.csv")!.async("string")).includes("R1"))
  assert((await zip.file("pick_and_place.csv")!.async("string")).includes("R1"))
  assert.deepEqual(
    publicRequests,
    [],
    "Offline package loading attempted public requests",
  )
  assert.deepEqual(errors, [])
  console.log(
    `Loaded ${modules.length} bundled modules and exported fabrication files with zero public requests.`,
  )
} finally {
  await browser.close()
  server.stop(true)
}
