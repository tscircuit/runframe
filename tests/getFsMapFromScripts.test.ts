import { test, expect } from "bun:test"
import { getFsMapFromScripts } from "../lib/utils/getFsMapFromScripts"
import { parseHTML } from "linkedom"

test("collects inline tsx script", async () => {
  const html = `<!DOCTYPE html><html><head>
  <script type="tscircuit-tsx">export default () => <board />;</script>
  </head></html>`
  const { document } = parseHTML(html)
  const fsMap = await getFsMapFromScripts(document)
  expect(fsMap.size).toBe(1)
  expect(fsMap.get("script0.tsx")?.includes("<board")).toBe(true)
})

test("collects src tsx script", async () => {
  const html = `<!DOCTYPE html><html><head>
  <script type="tscircuit-tsx" src="data:text/plain,export default () => <board />;"></script>
  </head></html>`
  const { document } = parseHTML(html)
  const fsMap = await getFsMapFromScripts(document)
  expect(fsMap.size).toBe(1)
  expect(fsMap.get("script0.tsx")?.includes("<board")).toBe(true)
})
