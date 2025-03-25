Optional features bundle functionality that already exists on tscircuit.com or
@tscircuit/cli. The features that are bundled can be quite large, e.g. entire
KiCad file parsers, so we don't put them into every build of RunFrame

RunFrame has multiple build targets, make sure to not import an unnecessary
optional feature into a lightweight build target, e.g. the CircuitJsonPreview
component shouldn't import any optional features because it's lightweight (it
can't even build tscircuit code). RunFrameForCli is a large component with a
toolbar containing many features, it's ok to bundle features into RunFrameForCli