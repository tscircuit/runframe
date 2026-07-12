export interface RenderableGeometrySummary {
  hasPcb: boolean
  hasSchematic: boolean
  hasCad: boolean
  hasSimulation: boolean
  hasAny: boolean
}

/**
 * Summarize which viewers have something to draw for a given circuit json.
 *
 * A completed render can produce circuit json that contains no geometry a
 * viewer can display (e.g. only source elements, or components that failed to
 * produce a footprint). When that happens the PCB/3D viewers mount with nothing
 * to draw and show a blank/black canvas. This summary lets the preview replace
 * that silent blank canvas with an explicit message and lets telemetry flag the
 * truly-empty case.
 *
 * Returns null when there is no circuit json yet (nothing has been rendered).
 */
export const getRenderableGeometrySummary = (
  circuitJson: any[] | null | undefined,
): RenderableGeometrySummary | null => {
  if (!circuitJson) return null

  let hasPcb = false
  let hasSchematic = false
  let hasCad = false
  let hasSimulation = false

  for (const element of circuitJson) {
    const type = (element as any)?.type
    if (typeof type !== "string") continue
    if (type.startsWith("pcb_")) hasPcb = true
    else if (type.startsWith("schematic_")) hasSchematic = true
    else if (type === "cad_component") hasCad = true
    else if (type.startsWith("simulation_")) hasSimulation = true
  }

  return {
    hasPcb,
    hasSchematic,
    hasCad,
    hasSimulation,
    hasAny: hasPcb || hasSchematic || hasCad || hasSimulation,
  }
}
