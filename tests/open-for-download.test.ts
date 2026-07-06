import { afterEach, describe, expect, mock, test } from "bun:test"
import { openForDownload } from "../lib/optional-features/exporting/open-for-download"

const originalDocument = globalThis.document
const originalURL = globalThis.URL

afterEach(() => {
  globalThis.document = originalDocument
  globalThis.URL = originalURL
})

describe("openForDownload", () => {
  test("creates a download anchor without navigating the current page", () => {
    const anchor = {
      download: "",
      href: "",
      rel: "",
      style: { display: "" },
      target: "",
      click: mock(() => {}),
    } as unknown as HTMLAnchorElement

    const appendChild = mock(() => anchor)
    const removeChild = mock(() => anchor)
    const createElement = mock(() => anchor)
    const createObjectURL = mock(() => "blob:test-download")
    const revokeObjectURL = mock(() => {})

    globalThis.document = {
      body: {
        appendChild,
        removeChild,
      },
      createElement,
    } as unknown as Document
    globalThis.URL = {
      ...originalURL,
      createObjectURL,
      revokeObjectURL,
    } as unknown as typeof URL

    openForDownload("{}", {
      fileName: "solver-input.json",
      mimeType: "application/json",
    })

    expect(createElement).toHaveBeenCalledWith("a")
    expect(createObjectURL).toHaveBeenCalledWith(
      new Blob(["{}"], { type: "application/json" }),
    )
    expect(anchor.href).toBe("blob:test-download")
    expect(anchor.download).toBe("solver-input.json")
    expect(anchor.target).toBe("_blank")
    expect(anchor.rel).toBe("noopener noreferrer")
    expect(anchor.style.display).toBe("none")
    expect(appendChild).toHaveBeenCalledWith(anchor)
    expect(anchor.click).toHaveBeenCalled()
    expect(removeChild).toHaveBeenCalledWith(anchor)
  })
})
