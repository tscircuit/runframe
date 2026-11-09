# Prebuilt reference designs

`@tscircuit/reference-designs` exports the versioned manifest schema and types.
It is built from `lib/reference-designs.ts` and has only Zod as a dependency, so
build and API tools do not install the viewer's compiler dependency graph. The
same contract remains available at `@tscircuit/runframe/reference-designs`.

`ReferenceDesignViewer`, exported from `@tscircuit/runframe/preview`, accepts a
parsed `referenceDesign` and a `loadConfiguration` callback. The callback receives
the selected configuration and an abort signal, and returns its prebuilt Circuit
JSON and assembly GLB. The viewer never executes TSX or reroutes the board.

The host resolves package files and verifies their hashes. Configuration changes
abort previous requests; late responses are ignored. The selected view persists
across configuration changes. Failed loads expose a retry action.

The manifest uses relative package paths rooted in `dist/`, explicit component and
chip associations, normalized JSON props, and SHA-256 artifact hashes. Presets are
the complete allowed configuration set. Hosts must resolve every asset from the
same package release and must not substitute another configuration's files.
