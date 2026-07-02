import { afterEach, describe, expect, test } from "bun:test"
import { copyToClipboard } from "../lib/utils/copyToClipboard"

const originalNavigator = globalThis.navigator
const originalDocument = (globalThis as any).document

afterEach(() => {
  // Restore globals mutated by individual tests.
  if (originalNavigator === undefined) {
    delete (globalThis as any).navigator
  } else {
    Object.defineProperty(globalThis, "navigator", {
      value: originalNavigator,
      configurable: true,
    })
  }
  ;(globalThis as any).document = originalDocument
})

const setNavigator = (value: any) => {
  Object.defineProperty(globalThis, "navigator", {
    value,
    configurable: true,
  })
}

describe("copyToClipboard", () => {
  test("uses the async Clipboard API when available (secure context)", async () => {
    let written: string | undefined
    setNavigator({
      clipboard: {
        writeText: async (text: string) => {
          written = text
        },
      },
    })

    await copyToClipboard("hello")
    expect(written).toBe("hello")
  })

  test("falls back to execCommand when navigator.clipboard is undefined (insecure context)", async () => {
    // Simulate an insecure context where the Clipboard API is unavailable,
    // as when runframe is embedded in an iframe on an HTTP/local-IP page.
    setNavigator({})

    let copiedValue: string | undefined
    const appended: any[] = []
    ;(globalThis as any).document = {
      createElement: () => {
        const el: any = { style: {}, setAttribute() {}, select() {} }
        return el
      },
      execCommand: (cmd: string) => {
        if (cmd === "copy") {
          copiedValue = appended[appended.length - 1]?.value
          return true
        }
        return false
      },
      body: {
        appendChild: (el: any) => appended.push(el),
        removeChild: () => {},
      },
    }

    await expect(copyToClipboard("world")).resolves.toBeUndefined()
    expect(copiedValue).toBe("world")
  })

  test("rejects instead of throwing synchronously when copying fails", async () => {
    setNavigator({})
    ;(globalThis as any).document = {
      createElement: () => ({ style: {}, setAttribute() {}, select() {} }),
      execCommand: () => false,
      body: { appendChild() {}, removeChild() {} },
    }

    await expect(copyToClipboard("nope")).rejects.toThrow()
  })
})
