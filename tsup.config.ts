import { defineConfig } from "tsup"

export default defineConfig({
  // tsup-node externalizes development dependencies too. Bundle the JSCDN-only
  // viewer and its implementation dependencies so consumers need only npm.
  noExternal: [
    "@tscircuit/system-block-viewer",
    "use-mouse-matrix-transform",
    "transformation-matrix",
  ],
})
