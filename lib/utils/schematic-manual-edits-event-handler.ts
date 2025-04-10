import type { ManualEditEvent } from "@tscircuit/props"
import type { AnyCircuitElement, SourceComponentBase } from "circuit-json"
import type { ManualEditState } from "./pcb-manual-edits-event-handler"
import { createInitialManualEditState } from "./pcb-manual-edits-event-handler"

export interface SchematicPlacement {
  selector: string
  position: { x: number; y: number }
  _edit_event_id?: string
}

export interface SchematicEditState {
  schematic_placements: SchematicPlacement[]
  edit_events: ManualEditEvent[]
}

export const createInitialSchematicEditState = (): SchematicEditState => ({
  schematic_placements: [],
  edit_events: [],
})

export const applySchematicEditEvents = ({
  editEvents,
  circuitJson,
  schematicEditsFileContent,
}: {
  editEvents: ManualEditEvent[]
  circuitJson: AnyCircuitElement[]
  schematicEditsFileContent?: string
}): ManualEditState => {
  const validatedSchematicEdits = ensureValidSchematicState(schematicEditsFileContent)

  const newSchematicEditState: ManualEditState = {
    pcb_placements: [...validatedSchematicEdits.pcb_placements],
    schematic_placements: [...validatedSchematicEdits.schematic_placements],
    edit_events: [...validatedSchematicEdits.edit_events],
    manual_trace_hints: [...validatedSchematicEdits.manual_trace_hints],
  }

  const handledEventIds = new Set<string>()

  for (const placement of newSchematicEditState.schematic_placements) {
    if (placement._edit_event_id) {
      handledEventIds.add(placement._edit_event_id)
    }
  }

  for (const event of newSchematicEditState.edit_events) {
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
      editEvent.edit_event_type === "edit_schematic_component_location" &&
      editEvent.schematic_component_id
    ) {
      const schematicComponent = circuitJson.find(
        (item: AnyCircuitElement) =>
          item.type === "schematic_component" &&
          item.schematic_component_id === editEvent.schematic_component_id,
      ) as SourceComponentBase

      if (!schematicComponent?.name) {
        continue
      }

      const existingPlacementIndex =
        newSchematicEditState.schematic_placements.findIndex(
          (p) => p.selector === schematicComponent.name,
        )

      const newPlacement: SchematicPlacement = {
        selector: schematicComponent.name,
        position: editEvent.new_center,
        _edit_event_id: editEvent.edit_event_id,
      }

      if (existingPlacementIndex !== -1) {
        newSchematicEditState.schematic_placements[existingPlacementIndex] = newPlacement
      } else {
        newSchematicEditState.schematic_placements.push(newPlacement)
      }
    } else {
      newSchematicEditState.edit_events.push(editEvent)
    }

    handledEventIds.add(editEvent.edit_event_id)
  }

  return newSchematicEditState
}

const ensureValidSchematicState = (schematicEditsFileContent?: string): ManualEditState => {
  if (!schematicEditsFileContent) return createInitialManualEditState()

  const schematicEditState = JSON.parse(schematicEditsFileContent)

  return {
    schematic_placements: Array.isArray(schematicEditState.schematic_placements)
      ? schematicEditState.schematic_placements
      : [],
    edit_events: Array.isArray(schematicEditState.edit_events)
      ? schematicEditState.edit_events
      : [],
    pcb_placements: Array.isArray(schematicEditState.pcb_placements)
      ? schematicEditState.pcb_placements
      : [],
    manual_trace_hints: Array.isArray(schematicEditState.manual_trace_hints)
      ? schematicEditState.manual_trace_hints
      : [],
  }
}