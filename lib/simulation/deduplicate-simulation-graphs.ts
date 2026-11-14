import type { AnyCircuitElement } from "circuit-json"

const contentKey = (element: AnyCircuitElement) =>
  JSON.stringify(
    Object.fromEntries(
      Object.entries(element)
        .filter(([key]) => key !== `${element.type}_id`)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  )

/** Nested groups can submit the same experiment; show each identical probe once. */
export const deduplicateSimulationGraphs = (elements: AnyCircuitElement[]) => {
  const seen = new Map<string, string>()
  const aliases = new Map<string, string>()
  for (const element of elements) {
    if (
      !element.type.startsWith("simulation_") ||
      !element.type.endsWith("_graph")
    )
      continue
    const id = (element as unknown as Record<string, string>)[
      `${element.type}_id`
    ]
    const key = contentKey(element)
    const previous = seen.get(key)
    if (previous) aliases.set(id, previous)
    else seen.set(key, id)
  }
  if (!aliases.size) return elements
  const traces = new Set<string>()
  return elements
    .filter((element) => {
      const id = (element as unknown as Record<string, string>)[
        `${element.type}_id`
      ]
      return !aliases.has(id)
    })
    .map(
      (element) =>
        Object.fromEntries(
          Object.entries(element).map(([key, value]) => [
            key,
            key.endsWith("_graph_id") && typeof value === "string"
              ? (aliases.get(value) ?? value)
              : value,
          ]),
        ) as AnyCircuitElement,
    )
    .filter((element) => {
      if (element.type !== "simulation_oscilloscope_trace") return true
      const key = contentKey(element)
      if (traces.has(key)) return false
      traces.add(key)
      return true
    })
}
