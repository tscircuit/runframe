import { useState, useCallback, useEffect, useMemo } from "react"
import type { ManualEditEvent } from "@tscircuit/props"
import { useRunFrameStore } from "lib/components/RunFrameWithApi/store"
import Debug from "lib/utils/debug"

const debug = Debug.extend("useEditEventController")

export type ExtManualEditEvent = ManualEditEvent & {
  _applied: boolean
}

/**
 * This is an implementation of the sequence diagram/state machine described in
 * the README.md file.
 *
 * We basically want to track the applied and unapplied edit events so that we
 * always feed edit events that aren't incorporated into the Circuit JSON into
 * the PCB/Schematic Viewer.
 */
export const useEditEventController = () => {
  const applyEditEventsAndUpdateManualEditsJson = useRunFrameStore(
    (s) => s.applyEditEventsAndUpdateManualEditsJson,
  )

  // Track all edit events - both applied and unapplied
  const [editEvents, setEditEvents] = useState<ExtManualEditEvent[]>([])

  // Track if we're currently rendering
  const [isRendering, setIsRendering] = useState(false)

  // Get unapplied edit events
  const unappliedEditEvents = editEvents.filter((ee) => !ee._applied)

  // Get applied edit events
  const appliedEditEvents = editEvents.filter((ee) => ee._applied)

  // During render, we want to show both applied and unapplied events
  // After render completes, we only show unapplied events
  const editEventsForRender = isRendering ? editEvents : unappliedEditEvents

  // Add a new edit event (always starts as unapplied)
  const pushEditEvent = useCallback((ee: ManualEditEvent) => {
    setEditEvents((prev) => [...prev, { ...ee, _applied: false }])
  }, [])

  // Mark an edit event as applied (persisted to manual-edits.json)
  const markEditEventApplied = useCallback((ee: ExtManualEditEvent) => {
    setEditEvents((prev) =>
      prev.map((event) =>
        event === ee ? { ...event, _applied: true } : event,
      ),
    )
  }, [])

  const markAllEditEventsApplied = useCallback(() => {
    setEditEvents((prev) => prev.map((ee) => ({ ...ee, _applied: true })))
  }, [])

  // Called when re-render starts
  const markRenderStarted = useCallback(() => {
    setIsRendering(true)
    if (editEvents.length === 0) return

    // Remove edit events that are applied to this render
    // Removes all applied events since they're now in the circuit JSON
    debug("removing edit events that are applied")
    setEditEvents((prev) => prev.filter((ee) => !ee._applied))
  }, [editEvents])

  // Called when re-render completes, it is now possible to re-apply new edit
  // events
  const markRenderComplete = useCallback(() => {
    setIsRendering(false)
  }, [])

  useEffect(() => {
    if (editEvents.filter((ee) => !ee._applied).length === 0) return
    const timeout = setTimeout(() => {
      markAllEditEventsApplied()
      applyEditEventsAndUpdateManualEditsJson(
        editEvents, //.filter((ee) => !ee._applied),
      )
    }, 1000)

    return () => clearTimeout(timeout)
  }, [editEvents])

  return {
    unappliedEditEvents,
    appliedEditEvents,
    editEventsForRender,
    pushEditEvent,
    markEditEventApplied,
    markRenderStarted,
    markRenderComplete,
    markAllEditEventsApplied,
  }
}
