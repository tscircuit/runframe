export async function getFsMapFromScripts(
  doc: Document = document,
): Promise<Map<string, string>> {
  const scripts = Array.from(
    doc.querySelectorAll<HTMLScriptElement>("script[type='tscircuit-tsx']"),
  )
  const fsMap = new Map<string, string>()
  let idx = 0
  for (const script of scripts) {
    const filename =
      script.getAttribute("data-filename") || `script${idx++}.tsx`
    try {
      if (script.src) {
        const res = await fetch(script.src)
        if (res.ok) {
          const text = await res.text()
          fsMap.set(filename, text)
        }
      } else {
        fsMap.set(filename, script.textContent || "")
      }
    } catch (err) {
      console.error("Failed to load script", script.src, err)
    }
  }
  return fsMap
}
