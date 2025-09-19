# @tscircuit/runframe

[tscircuit](https://github.com/tscircuit/tscircuit) ⋅ [View Examples](https://runframe.vercel.app)

A React component that runs tscircuit inside a webworker and shows PCB, Schematic, 3D and other previews.

- Automatically imports other snippets and libraries if imported
- Runs inside webworker (doesn't block the main thread)
- Converts typescript to javascript using babel

## Usage

```tsx
import { RunFrame } from "@tscircuit/runframe/runner"

const App = () => (
  <RunFrame
    fsMap={{
      "main.tsx": `
circuit.add(
  <resistor resistance="1k" />
)
`,
    }}
    entrypoint="main.tsx"
    onCircuitJsonChange={(circuitJson) => void}
    onRenderingFinished={({ circuitJson }) => void}
    onRenderEvent={(event) => void}
    onError={(error) => void}
    availableTabs={["pcb", "schematic", "cad"]}
    defaultTab="pcb"
  />
)
```

### Using CircuitJsonPreview Directly

If you already have circuit JSON:

```tsx
import { CircuitJsonPreview } from "@tscircuit/runframe/preview"

const App = () => (
  <CircuitJsonPreview
    circuitJson={myCircuitJson}
    showCodeTab={false}
    showJsonTab={true}
    className="h-screen"
    headerClassName="px-4"
    isFullScreen={false}
    onToggleFullScreen={() => void}
  />
)
```

### Standalone Iframe

```html
<iframe
  id="runframe"
  src="https://runframe.tscircuit.com/iframe.html"
  style="width: 100%; height: 600px; border: none;"
></iframe>

<script>
  const iframe = document.getElementById("runframe")
  
  window.addEventListener("message", (event) => {
    if (event.data?.runframe_type === "runframe_ready_to_receive") {
      iframe.contentWindow.postMessage({
        runframe_type: "runframe_props_changed",
        runframe_props: {
          fsMap: {
            "main.tsx": `circuit.add(<resistor resistance="1k" />)`,
          },
          entrypoint: "main.tsx",
        },
      }, "*")
    }
  })
</script>
```
