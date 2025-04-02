import ky from "ky"
import { RunFrameForCli } from "lib/components/RunFrameForCli/RunFrameForCli"
import { useEventHandler } from "lib/components/RunFrameForCli/useEventHandler"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import { useEffect, useState } from "react"
import { DebugEventsTable } from "./utils/DebugEventsTable"

export default () => {
  const recentEvents = useRunFrameStore((state) => state.recentEvents)
  const pushEvent = useRunFrameStore((state) => state.pushEvent)
  const [selectedScenario, setSelectedScenario] = useState<string>("none")
  const [setSimulateScenarioOrder] = useRunFrameStore((s) => [
    s.setSimulateScenarioOrder,
  ])

  const orderSteps = [
    { key: "are_gerbers_generated", label: "Generate Gerbers" },
    { key: "are_gerbers_uploaded", label: "Upload Gerbers" },
    { key: "is_gerber_analyzed", label: "Analyze Gerber" },
    { key: "are_initial_costs_calculated", label: "Calculate Initial Costs" },
    { key: "is_pcb_added_to_cart", label: "Add PCB to Cart" },
    { key: "is_bom_uploaded", label: "Upload BOM" },
    { key: "is_pnp_uploaded", label: "Upload PnP" },
    { key: "is_bom_pnp_analyzed", label: "Analyze BOM & PnP" },
    { key: "is_bom_parsing_complete", label: "BOM Parsing Complete" },
    { key: "are_components_available", label: "Components Available" },
    { key: "is_patch_map_generated", label: "Generate Patch Map" },
    { key: "is_json_merge_file_created", label: "Create JSON Merge File" },
    { key: "is_dfm_result_generated", label: "Generate DFM Result" },
    { key: "are_files_downloaded", label: "Download Files" },
    {
      key: "are_product_categories_fetched",
      label: "Fetch Product Categories",
    },
    { key: "are_final_costs_calculated", label: "Calculate Final Costs" },
    { key: "is_json_merge_file_updated", label: "Update JSON Merge File" },
    { key: "is_added_to_cart", label: "Add to Cart" },
  ]

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        await ky
          .get("/registry/_fake/move_orders_forward", {
            headers: {
              Authorization: `Bearer account-1234`,
            },
          })
          .json()
      } catch (error) {
        console.error("Error polling order progress:", error)
      }
    }, 2000) // Poll every 2 seconds

    return () => clearInterval(pollInterval)
  }, [])

  useEventHandler(async (event) => {
    if (event.event_type === "REQUEST_TO_SAVE_SNIPPET") {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (!event.snippet_name) {
        pushEvent({
          event_type: "FAILED_TO_SAVE_SNIPPET",
          error_code: "SNIPPET_UNSET",
          available_snippet_names: [
            "my-snippet-1",
            "my-snippet-2",
            "led-driver-board",
            "555-timer",
            "my-snippet-3",
            "my-snippet-4",
            "epaper-display",
            "voltage-regulator",
            "led-matrix-9x9",
            "led-matrix-16x16",
            "led-matrix-24x24",
            "led-matrix-32x32",
            "led-matrix-40x40",
          ],
        })
      } else {
        pushEvent({
          event_type: "SNIPPET_SAVED",
        })
      }
    }
  })

  useEffect(() => {
    setTimeout(async () => {
      fetch("/api/events/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "main.tsx",
          text_content: `
import manualEdits from "./manual-edits.json"

console.log("inside render manualEdits", manualEdits)

circuit.add(
<board width="10mm" height="10mm" manualEdits={manualEdits}>
  <resistor name="R1" resistance="1k" footprint="0402" />
  <capacitor name="C1" capacitance="1uF" footprint="0603" pcbX={4} />
  <trace from=".R1 .pin1" to=".C1 .pin1" />
</board>
)`,
        }),
      })
      fetch("/api/files/upsert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file_path: "manual-edits.json",
          text_content: JSON.stringify({}),
        }),
      })
    }, 500)
  }, [])

  if (
    typeof window !== "undefined" &&
    window.location.origin.includes("vercel.app")
  ) {
    return (
      <div>
        <h1>RunFrame with API</h1>
        <p>
          We don't currently deploy the API to vercel, try locally! The vite
          plugin will automatically load it.
        </p>
      </div>
    )
  }

  return (
    <>
      <RunFrameForCli
        debug
        scenarioSelectorContent={
          <div className="rf-flex rf-items-center">
            <label
              htmlFor="scenario"
              className="rf-mr-2 rf-text-red-700 rf-text-sm"
            >
              Select Test Scenario:
            </label>
            <select
              id="scenario"
              className="rf-bg-white rf-border rf-border-gray-300 rf-rounded-md rf-shadow-sm rf-px-3 rf-py-1.5 rf-text-sm focus:rf-outline-none focus:rf-ring-2 focus:rf-ring-blue-500 focus:rf-border-blue-500"
              value={selectedScenario}
              onChange={(e) => {
                setSelectedScenario(e.target.value)
                setSimulateScenarioOrder(
                  e.target.value === "none" ? "" : e.target.value,
                )
              }}
            >
              <option value="none">None</option>
              {orderSteps.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label} Failed
                </option>
              ))}
            </select>
          </div>
        }
      />
      <DebugEventsTable />
    </>
  )
}
