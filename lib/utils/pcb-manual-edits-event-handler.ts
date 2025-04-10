import type { ManualTraceHint } from "@tscircuit/layout"
import { getManualTraceHintFromEvent } from "@tscircuit/layout"
import type { ManualEditEvent } from "@tscircuit/props"
import type {
  AnyCircuitElement,
  PcbComponent,
  SourceComponentBase,
} from "circuit-json"
import type { SchematicPlacement } from "./schematic-manual-edits-event-handler"

export interface PCBPlacement {
  selector: string
  center: { x: number; y: number }
  relative_to: "group_center"
  _edit_event_id?: string
}

export interface ManualEditState {
  pcb_placements: PCBPlacement[]
  schematic_placements: SchematicPlacement[]
  edit_events: ManualEditEvent[]
  manual_trace_hints: ManualTraceHint[]
}

export const createInitialManualEditState = (): ManualEditState => ({
  pcb_placements: [],
  schematic_placements: [],
  edit_events: [],
  manual_trace_hints: [],
})

export const applyPcbEditEvents = ({
  editEvents,
  circuitJson,
  manualEditsFileContent,
}: {
  editEvents: ManualEditEvent[]
  circuitJson: AnyCircuitElement[]
  manualEditsFileContent?: string
}): ManualEditState => {
  const validatedManualEdits = ensureValidState(manualEditsFileContent)

  const newManualEditState: ManualEditState = {
    pcb_placements: [...validatedManualEdits.pcb_placements],
    schematic_placements: [...validatedManualEdits.schematic_placements],
    edit_events: [...validatedManualEdits.edit_events],
    manual_trace_hints: [...validatedManualEdits.manual_trace_hints],
  }

  const handledEventIds = new Set<string>()

  for (const placement of newManualEditState.pcb_placements) {
    if (placement._edit_event_id) {
      handledEventIds.add(placement._edit_event_id)
    }
  }

  for (const event of newManualEditState.edit_events) {
    if (event.edit_event_id) {
      handledEventIds.add(event.edit_event_id)
    }
  }

  for (const editEvent of editEvents) {
    if (
      (editEvent.in_progress && !editEvent.edit_event_id) ||
      handledEventIds.has(editEvent.edit_event_id)
    ) {
      continue
    }

    if (
      editEvent.edit_event_type === "edit_pcb_component_location" &&
      editEvent.pcb_component_id
    ) {
      const pcbComponent = circuitJson.find(
        (item: AnyCircuitElement) =>
          item.type === "pcb_component" &&
          item.pcb_component_id === editEvent.pcb_component_id,
      ) as PcbComponent

      if (!pcbComponent?.pcb_component_id) continue

      const nameofComponent = circuitJson.find(
        (item: AnyCircuitElement) =>
          item.type === "source_component" &&
          item.source_component_id === pcbComponent.source_component_id,
      ) as SourceComponentBase

      const existingPlacementIndex =
        newManualEditState.pcb_placements.findIndex(
          (p) => p.selector === nameofComponent.name,
        )

      const newPlacement: PCBPlacement = {
        selector: nameofComponent.name,
        center: editEvent.new_center,
        relative_to: "group_center",
        _edit_event_id: editEvent.edit_event_id,
      }

      if (existingPlacementIndex !== -1) {
        newManualEditState.pcb_placements[existingPlacementIndex] =
          newPlacement
      } else {
        newManualEditState.pcb_placements.push(newPlacement)
      }
    } else if (editEvent.edit_event_type === "edit_pcb_trace_hint") {
      const newTraceHint = getManualTraceHintFromEvent(circuitJson, editEvent)
      if (newTraceHint) {
        newManualEditState.manual_trace_hints = [
          ...newManualEditState.manual_trace_hints.filter(
            (th) => th.pcb_port_selector !== newTraceHint.pcb_port_selector,
          ),
          newTraceHint,
        ]
      }
    } else {
      newManualEditState.edit_events.push(editEvent)
    }

    handledEventIds.add(editEvent.edit_event_id)
  }

  return newManualEditState
}

// Helper function to ensure we have a valid state
const ensureValidState = (manualEditsFileContent?: string): ManualEditState => {
  if (!manualEditsFileContent) return createInitialManualEditState()

  const manualEditState = JSON.parse(manualEditsFileContent)

  return {
    pcb_placements: Array.isArray(manualEditState.pcb_placements)
      ? manualEditState.pcb_placements
      : [],
    schematic_placements: Array.isArray(manualEditState.schematic_placements)
      ? manualEditState.schematic_placements
      : [],
    edit_events: Array.isArray(manualEditState.edit_events)
      ? manualEditState.edit_events
      : [],
    manual_trace_hints: Array.isArray(manualEditState.manual_trace_hints)
      ? manualEditState.manual_trace_hints
      : [],
  }
}