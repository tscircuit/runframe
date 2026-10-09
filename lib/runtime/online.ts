import importer from "@tscircuit/internal-dynamic-import"
import type {
  RunFrameModuleMap,
  RunFrameModuleName,
  RunFrameRuntime,
} from "./types"

const EASYEDA_BROWSER_URL =
  "https://cdn.jsdelivr.net/npm/easyeda@latest/dist/browser/index.js"

export const createOnlineRuntime = (): RunFrameRuntime => {
  const pending = new Map<RunFrameModuleName, Promise<unknown>>()
  return {
    mode: "online",
    fetch: (...args) => globalThis.fetch(...args),
    modules: {
      async load<K extends RunFrameModuleName>(name: K) {
        let promise = pending.get(name)
        if (!promise) {
          promise = (async () => {
            if (name === "easyeda") {
              return import(/* @vite-ignore */ EASYEDA_BROWSER_URL)
            }
            if (name === "circuit-json-to-altium") {
              // This pinned Git dependency is already bundled by Vite.
              return import("circuit-json-to-altium")
            }
            return importer(name)
          })()
          pending.set(name, promise)
          promise.catch(() => {
            if (pending.get(name) === promise) pending.delete(name)
          })
        }
        return promise as Promise<RunFrameModuleMap[K]>
      },
    },
  }
}
