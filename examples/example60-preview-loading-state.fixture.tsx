import { CircuitJsonPreview } from "lib/components/CircuitJsonPreview/CircuitJsonPreview"
import React from "react"

/**
 * "Render in progress, no circuitJson yet" state. Before the fix this showed
 * the static "Tip:" empty state on every canvas; now it should show a
 * loading/progress indicator so users can tell a render is underway.
 */
const Rendering = () => (
  <div style={{ height: "700px" }}>
    <CircuitJsonPreview
      circuitJson={null}
      isRunningCode={true}
      renderLog={{
        progress: 0.42,
        lastRenderEvent: {
          type: "board:renderPhaseStarted",
          renderId: "board0",
          eventsProcessed: 12,
          createdAt: 0,
          phase: "SchematicLayout",
        },
      }}
    />
  </div>
)

/**
 * "Nothing has been run yet" state — no render underway, so the canvas should
 * still show the original "Tip:" empty state with a Run Code button.
 */
const NotRun = () => (
  <div style={{ height: "700px" }}>
    <CircuitJsonPreview
      circuitJson={null}
      isRunningCode={false}
      onRunClicked={() => {}}
    />
  </div>
)

export default { Rendering, NotRun }
