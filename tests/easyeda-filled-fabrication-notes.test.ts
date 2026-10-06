import { expect, spyOn, test } from "bun:test"
import "bun-match-svg"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import {
  EasyEdaJsonSchema,
  convertEasyEdaJsonToCircuitJson,
} from "easyeda/browser"
import * as easyeda from "easyeda/browser"
import ky from "ky"
import * as easyedaLoader from "../lib/optional-features/importing/load-easyeda-browser"
import rawEasy from "./fixtures/c41413180.raweasy.json"

test("RunFrame JLCPCB import preserves filled RGB fabrication symbols", async () => {
  const previousWindow = globalThis.window
  if (!previousWindow)
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {},
    })
  const loaderMock = spyOn(
    easyedaLoader,
    "loadEasyedaBrowser",
  ).mockResolvedValue(easyeda)
  const fetchMock = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(
          new Headers(init?.headers).get("X-Target-Url") ?? String(input),
        )
        if (url.pathname === "/api/components/search") {
          return Response.json({
            success: true,
            result: { lists: { lcsc: [rawEasy] } },
          })
        }
        if (url.pathname === `/api/components/${rawEasy.uuid}`) {
          return Response.json({ success: true, result: rawEasy })
        }
        if (url.hostname === "modelcdn.tscircuit.com")
          return new Response(null, { status: 404 })
        throw new Error(`Unexpected fetch: ${url}`)
      },
      { preconnect: fetch.preconnect },
    ),
  )
  const upsertMock = spyOn(ky, "post").mockImplementation(
    () => Promise.resolve(new Response()) as ReturnType<typeof ky.post>,
  )
  try {
    const { importComponentFromJlcpcb } = await import(
      "../lib/optional-features/importing/import-component-from-jlcpcb"
    )
    const { filePath } = await importComponentFromJlcpcb("C41413180")
    expect(filePath).toMatch(/^imports\/.*\.tsx$/)
    expect(upsertMock).toHaveBeenCalledTimes(1)
    const saved = upsertMock.mock.calls[0]?.[1]?.json as {
      file_path: string
      text_content: string
    }
    expect(saved.file_path).toBe(filePath)
    const paths =
      saved.text_content.match(/<fabricationnotepath\b[^>]*\/>/g) ?? []
    expect(paths).toHaveLength(4)
    for (const path of paths) {
      expect(path).toContain("isFilled")
      expect(path).toContain("hasStroke={false}")
      expect(path).toContain('strokeWidth="0mm"')
    }
  } finally {
    upsertMock.mockRestore()
    fetchMock.mockRestore()
    loaderMock.mockRestore()
    if (!previousWindow) Reflect.deleteProperty(globalThis, "window")
  }
  const circuitJson = convertEasyEdaJsonToCircuitJson(
    EasyEdaJsonSchema.parse(rawEasy),
  )
  const paths = circuitJson.filter(
    (element) => element.type === "pcb_fabrication_note_path",
  )
  expect(paths).toHaveLength(4)
  for (const path of paths) {
    expect(path).toMatchObject({
      is_filled: true,
      has_stroke: false,
      stroke_width: 0,
    })
    expect(path.route.at(-1)).toEqual(path.route[0]!)
  }
  const plus = paths.find((path) => path.route.length === 13)
  if (!plus) throw new Error("Expected the supplier's plus-sign geometry")
  expect(Math.abs(plus.route[0]!.y - plus.route[1]!.y)).toBeCloseTo(0.127, 5)
  await expect(convertCircuitJsonToPcbSvg(circuitJson)).toMatchSvgSnapshot(
    import.meta.path,
  )
})
