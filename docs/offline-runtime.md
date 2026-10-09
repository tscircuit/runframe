# Offline package loading

The offline entrypoint supplies runframe's optional converters through static
imports. Exporters, the BOM tab, EasyEDA conversion and KiCad conversion consume
the same typed module-provider interface. The existing entrypoints retain their
online default; an application can also inject its own runtime.

```tsx
import {
  CircuitJsonPreview,
  RunFrame,
  createOfflineRuntime,
} from "@tscircuit/runframe/offline"

// Create once, rather than recreating the runtime on every render.
const runtime = createOfflineRuntime({
  // Supply these when executing TSX. Circuit JSON previews do not need a worker.
  workerUrl: "/offline-assets/eval-worker.js",
  evalVersion: "0.0.1581",
})

<RunFrame runtime={runtime} fsMap={files} />
<CircuitJsonPreview runtime={runtime} circuitJson={circuitJson} />
```

Use `RunFrameRuntimeProvider` to supply a runtime to a subtree. Nested providers
and explicit component runtime props override the inherited provider. Pure
import/export functions accept a `runtime` argument because they execute outside
React context:

```ts
await exportAndDownload({
  runtime,
  exportName: "Fabrication Files",
  circuitJson,
  projectName: "board",
})

const easyeda = await runtime.modules.load("easyeda")
const tsx = await easyeda.convertRawEasyToTsx({ rawEasy: suppliedEasyedaFile })
```

The module map includes Gerber, BOM, PnP, KiCad, GLTF, STEP, LightBurn, component
box, SVG, KiCad import, Altium and EasyEDA browser conversion. Missing modules in
custom bundled providers fail with `OfflineModuleUnavailableError`. There is no
CDN fallback. Module registries are snapshots; callers cannot replace an installed
module by mutating the original registry.

`runtime.fetch` is a separate resource transport. The supplied offline UI
transport allows the application origin and inline data, preserves binary
responses, and refuses automatic redirects and public URLs. It does not override
the embedding page's global fetch. The runtime suppresses activity/error
telemetry, public evaluator-version discovery, and hosted file-menu integrations.

Offline runner startup requires a local worker and explicit version. It bypasses
public worker/version discovery, disables npm CDN fallback, defaults supplier
lookup and cloud routing off, and disposes its pending worker on configuration
changes and unmount. The containing application supplies the worker artifact.
A request for a different version than the runtime declares fails before execution.
`RunFrameWithApi` and `RunFrameForCli` also require a local file-server API;
their polling and cache traffic is outside the module/resource transport.

## Build and checks

```sh
bun install
bun run build:offline
bun test
bun node_modules/typescript/bin/tsc --noEmit
bun run test:offline-browser
```

The build emits `dist/offline.js`, its declaration file, and
`dist/standalone-offline.min.js`. The standalone bundle exposes `RunframeOffline`;
it includes React, is an API bundle and does not automatically mount a page.
The ESM build shares the application's React and may emit companion chunks;
ship the complete `dist` directory when using it. Offline builds alias
the backwards-compatible online default to an explicit missing-runtime error,
so consumers must supply a runtime. The static provider is kept out of ordinary
online entrypoints.

The browser check loads every bundled module and downloads a fabrication ZIP
with public requests blocked. It uses Playwright's installed Chromium, or an
executable selected by `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Install the browser
on the connected development/build machine with `bunx playwright install chromium`.

## Remaining work for a complete disconnected distribution

This establishes offline loading for runframe's first-party feature packages.
It does not yet certify every transitive dependency or arbitrary user project:

- The evaluator needs an offline worker build, worker-local platform adapters,
  and a guard on the `@tsci` registry path, which currently bypasses
  `disableCdnLoading`. Its wrapper still has global worker ownership, so multiple
  simultaneously executing instances require an upstream ownership change.
- The evaluator's Comlink platform callbacks cannot directly return a native
  `Response`. Its existing fetch proxy forwards text and needs a binary response
  envelope if parent-mediated fetching is used. Build the local fetch adapter
  inside the worker instead of passing the UI transport as `platformFetch`.
- Viewer/engine packages still need local WASM, font, model and analysis asset
  providers. Statically importing a wrapper does not remove its own runtime
  loaders. GLTF, STEP, component-box rendering and simulation need these checks.
  Exports that reach native resvg currently fail with a local-renderer message.
  The emitted dependency graph still contains dynamic imports of `manifold-3d`
  and public jsDelivr adapters for Manifold, OCCT and resvg WASM. The module-loading
  check does not exercise those deeper feature branches.
- Component search/import needs local catalog data and supplier providers. The
  EasyEDA converter works on a supplied file; public EasyEDA acquisition is
  disabled for offline runtimes. A forwarding proxy would still require Internet.
- Project configuration can replace platform defaults. Host network policy must
  become an enforced evaluator-level limit for the complete offline edition.

For that release, audit the emitted UI and worker code for remaining dynamic
imports/externals, test the complete feature matrix with cold caches, and deny
public access at the deployment boundary. The module-loading check here covers
bundle initialization, module resolution and fabrication export.
