import { test, expect } from "bun:test"

test("loadInitialFiles substitutes static assets", async () => {
  ;(globalThis as any).window = {}

  const fetchCalls: string[] = []
  const originalFetch = global.fetch
  global.fetch = async (input: any) => {
    const url = input.toString()
    fetchCalls.push(url)
    if (url.endsWith("/files/list")) {
      return new Response(
        JSON.stringify({
          file_list: [
            { file_id: "1", file_path: "index.tsx" },
            { file_id: "2", file_path: "data.json" },
            { file_id: "3", file_path: "style.css" },
          ],
        }),
        { status: 200 },
      )
    }
    if (url.includes("/files/get")) {
      const u = new URL(url, "http://localhost")
      const file_path = u.searchParams.get("file_path")!
      return new Response(
        JSON.stringify({
          file: {
            file_id: "x",
            file_path,
            text_content: `${file_path} content`,
          },
        }),
        { status: 200 },
      )
    }
    throw new Error(`unexpected url ${url}`)
  }

  const { useRunFrameStore } = await import(
    "lib/components/RunFrameWithApi/store"
  )

  await useRunFrameStore.getState().loadInitialFiles()
  const fsMap = useRunFrameStore.getState().fsMap

  expect(fsMap.get("index.tsx")).toBe("index.tsx content")
  expect(fsMap.get("data.json")).toBe("data.json content")
  expect(fsMap.get("style.css")).toBe("__STATIC_ASSET__")
  expect(
    fetchCalls.filter(
      (u) => u.includes("style.css") && u.includes("/files/get"),
    ).length,
  ).toBe(0)

  global.fetch = originalFetch
  // @ts-ignore
  delete globalThis.window
})
