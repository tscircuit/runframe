import { resolve } from "node:path"
import { defineConfig } from "tsup"

export default defineConfig({
  entry: { offline: "lib/offline.tsx" },
  format: ["esm"],
  platform: "browser",
  // Vite emits the browser-compatible JS and bundles the feature dependencies.
  dts: { only: true, resolve: true },
  clean: false,
  external: ["@resvg/resvg-js", "@resvg/resvg-wasm"],
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      "lib/runtime/default-runtime": resolve("lib/runtime/require-runtime.ts"),
    }
  },
})
