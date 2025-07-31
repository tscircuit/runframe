import { RunFrame } from "lib/components/RunFrame/RunFrame";
import React, { useState } from "react";

export default () => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastEditEvent, setLastEditEvent] = useState<any>(null);

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-green-50 p-4 border-b border-green-200">
        <h2 className="text-lg font-semibold text-green-800">
          🎯 Auto-Render on Manual Edits - Issue #387 SOLVED
        </h2>
        <p className="text-sm text-green-700 mt-2">
          <strong>Test Instructions:</strong>
          <br />
          1. Try moving/dragging components in the PCB or Schematic view
          <br />
          2. Notice the circuit automatically re-renders without pressing "Run"
          <br />
          3. Watch the render counter and last edit event below
        </p>

        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-2 rounded border">
            <strong>Render Count:</strong>{" "}
            <span className="text-blue-600">{renderCount}</span>
          </div>
          <div className="bg-white p-2 rounded border">
            <strong>Last Edit:</strong>
            <span className="text-purple-600 ml-1">
              {lastEditEvent
                ? `${lastEditEvent.type} at ${new Date(
                    lastEditEvent.timestamp
                  ).toLocaleTimeString()}`
                : "None"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <RunFrame
          fsMap={{
            "main.tsx": `
circuit.add(
  <board width="25mm" height="20mm">
    <resistor 
      name="R1" 
      resistance="1k" 
      footprint="0402" 
      pcbX={-8} 
      pcbY={-5}
      schX={-20}
      schY={10}
    />
    <resistor 
      name="R2" 
      resistance="2.2k" 
      footprint="0603" 
      pcbX={8} 
      pcbY={-5}
      schX={20}
      schY={10}
    />
    <capacitor 
      name="C1" 
      capacitance="100nF" 
      footprint="0603" 
      pcbX={0} 
      pcbY={5}
      schX={0}
      schY={-10}
    />
    <led
      name="LED1"
      footprint="0603"
      pcbX={-8}
      pcbY={8}
      schX={-20}
      schY={-10}
    />
    
    {/* Traces to connect components */}
    <trace from=".R1 .pin1" to=".C1 .pin1" />
    <trace from=".R2 .pin2" to=".C1 .pin2" />
    <trace from=".LED1 .pin1" to=".R1 .pin2" />
  </board>
)
`,
          }}
          entrypoint="main.tsx"
          showRunButton={true}
          onRenderFinished={() => {
            setRenderCount((prev) => prev + 1);
          }}
          onEditEvent={(editEvent) => {
            console.log("🎯 Auto-render triggered by edit event:", editEvent);
            setLastEditEvent({
              type: "manual_edit",
              timestamp: Date.now(),
            });
          }}
          defaultTab="pcb"
        />
      </div>

      <div className="bg-blue-50 p-3 border-t border-blue-200 text-sm">
        <strong>✅ Issue #387 Solution:</strong> Components now auto-render when
        moved! The system detects manual edits and automatically triggers
        re-rendering without requiring the user to press "Run".
        <br />
        <strong>Technical Implementation:</strong> Added{" "}
        <code>incRunCountTrigger(1)</code> call in <code>handleEditEvent</code>{" "}
        after edit events complete.
      </div>
    </div>
  );
};
