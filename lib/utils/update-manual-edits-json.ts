import type { EditPcbComponentLocationEvent } from "@tscircuit/props"
import type { SourceComponentBase } from "circuit-json"
import type { PcbComponent } from "circuit-json"
import type { RunFrameProps } from "lib/runner"
import type { AnyCircuitElement } from "circuit-json"

export const updateManualEditsJson = (event: EditPcbComponentLocationEvent, props: RunFrameProps, circuitJson: AnyCircuitElement[], lastFsMapRef: React.MutableRefObject<Map<string, string> | null>) => {
    const manualEditsPath = "manual-edits.json"

    // Handle both Map and object fsMap formats
    let manualEditsContent: string
    if (props.fsMap instanceof Map) {
        manualEditsContent = props.fsMap.get(manualEditsPath) || "{}"
    } else {
        manualEditsContent = props.fsMap[manualEditsPath] || "{}"
    }

    // Parse current manual edits with targeted error handling
    let manualEdits: any;
    try {
        manualEdits = JSON.parse(manualEditsContent)
    } catch (error) {
        console.error("Failed to parse manual-edits.json:", error)
        manualEdits = {}
    }

    // Initialize pcb_placements array if it doesn't exist
    if (!manualEdits.pcb_placements) {
        manualEdits.pcb_placements = []
    }

    const pcb_component = circuitJson?.filter(
        (c: any) => c.type === "pcb_component" && c.pcb_component_id === event.pcb_component_id,
    ) as PcbComponent[]

    if (!pcb_component?.length) {
        console.error("PCB component not found:", event.pcb_component_id)
        return
    }

    const source_component = circuitJson?.filter(
        (c: any) => c.type === "source_component" && c.source_component_id === pcb_component[0].source_component_id,
    ) as SourceComponentBase[]

    if (!source_component?.length) {
        console.error("Source component not found for PCB component:", pcb_component[0])
        return
    }

    const selector = source_component[0].name

    const existingPlacementIndex = manualEdits.pcb_placements.findIndex(
        (p: any) => p.selector === selector,
    )

    const newPlacement = {
        selector: selector,
        center: {
            x: event.new_center.x,
            y: event.new_center.y,
        },
        relative_to: "group_center",
    }

    if (existingPlacementIndex >= 0) {
        manualEdits.pcb_placements[existingPlacementIndex] = newPlacement
    } else {
        manualEdits.pcb_placements.push(newPlacement)
    }

    if (!manualEdits.edit_events) {
        manualEdits.edit_events = []
    }

    if (!manualEdits.manual_trace_hints) {
        manualEdits.manual_trace_hints = []
    }

    const updatedManualEditsJson = JSON.stringify(manualEdits, null, 2)

    // Create updated fsMap based on the format (Map or object)
    if (props.fsMap instanceof Map) {
        const newFsMap = new Map(props.fsMap)
        newFsMap.set(manualEditsPath, updatedManualEditsJson)

        // Call the onFsMapUpdate callback with the map converted to object
        if (props.onFsMapUpdate) {
            const fsMapObj = Object.fromEntries(newFsMap.entries())
            props.onFsMapUpdate(fsMapObj)
        }
    } else {
        // For object-based fsMap
        const newFsMap = {
            ...props.fsMap,
            [manualEditsPath]: updatedManualEditsJson,
        }

        // Call the onFsMapUpdate callback
        if (props.onFsMapUpdate) {
            props.onFsMapUpdate(newFsMap)
        }
    }

    // Update the lastFsMapRef to prevent unnecessary re-renders
    // Create a Map version for internal use
    const mapForRef =
        props.fsMap instanceof Map
            ? new Map(props.fsMap)
            : new Map(Object.entries(props.fsMap))
    mapForRef.set(manualEditsPath, updatedManualEditsJson)
    lastFsMapRef.current = mapForRef
}