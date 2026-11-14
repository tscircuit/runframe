import type { AnyCircuitElement } from "circuit-json"
import importer from "@tscircuit/internal-dynamic-import"

/** Rebuild a recognized engine request without flattening local device names. */
export const prepareSpiceNetlist = async (
  circuitJson: AnyCircuitElement[],
  original: string,
): Promise<string> => {
  const probeIds = new Set<string>()
  for (const match of original.matchAll(
    /^\* tscircuit_(?:current_)?probe (.+)$/gm,
  )) {
    try {
      const metadata = JSON.parse(match[1])
      const id =
        metadata.simulation_voltage_probe_id ??
        metadata.simulation_current_probe_id
      if (typeof id === "string") probeIds.add(id)
    } catch {
      return original
    }
  }
  if (!probeIds.size) return original
  const [
    { circuitJsonToSpice },
    { getSourcePortConnectivityMapFromCircuitJson },
  ] = await Promise.all([
    importer("circuit-json-to-spice@0.0.45"),
    importer("circuit-json-to-connectivity-map@0.0.22"),
  ])
  let input: AnyCircuitElement[] | undefined
  for (const experiment of circuitJson.filter(
    (e) => e.type === "simulation_experiment",
  )) {
    // Sweeps change values after the snapshot is taken. Leave those requests to
    // their engine rather than reconstructing a different sweep coordinate.
    if (
      circuitJson.some(
        (e) =>
          e.type === "simulation_parameter_sweep" &&
          e.simulation_experiment_id === experiment.simulation_experiment_id,
      )
    )
      continue
    const candidate = circuitJson.filter((element) => {
      if (element.type === "simulation_experiment")
        return element === experiment
      if (element.type === "simulation_voltage_probe")
        return probeIds.has(element.simulation_voltage_probe_id)
      if (element.type === "simulation_current_probe")
        return probeIds.has(element.simulation_current_probe_id)
      if (element.type === "simulation_oscilloscope_trace") {
        return (
          (element.simulation_voltage_probe_id &&
            probeIds.has(element.simulation_voltage_probe_id)) ||
          (element.simulation_current_probe_id &&
            probeIds.has(element.simulation_current_probe_id))
        )
      }
      return (
        !element.type.endsWith("_graph") && !element.type.endsWith("_error")
      )
    })
    // This also protects custom analyses, engine versions and modified netlists.
    if (
      circuitJsonToSpice(candidate).toSpiceString().trim() === original.trim()
    ) {
      input = candidate
      break
    }
  }
  if (!input) return original

  const groups = input.filter((e) => e.type === "source_group")
  const ancestors = (groupId: string | undefined) => {
    const path: string[] = []
    while (groupId && !path.includes(groupId)) {
      path.push(groupId)
      groupId = groups.find(
        (g) => g.source_group_id === groupId,
      )?.parent_source_group_id
    }
    return path
  }
  const probes = input.filter(
    (e) =>
      e.type === "simulation_voltage_probe" ||
      e.type === "simulation_current_probe",
  )
  const paths = probes.map((probe) =>
    ancestors(
      probe.subcircuit_id
        ? groups.find((g) => g.subcircuit_id === probe.subcircuit_id)
            ?.source_group_id
        : undefined,
    ),
  )
  const scope = paths[0]?.find((id) => paths.every((path) => path.includes(id)))
  const components = input.filter((e) => e.type === "source_component")
  const ports = input.filter((e) => e.type === "source_port")
  const included = new Set(
    components
      .filter((e) => !scope || ancestors(e.source_group_id).includes(scope))
      .map((e) => e.source_component_id),
  )

  // Include anything explicitly wired into the circuit, across group boundaries.
  // A shared ground alone does not bring every other circuit into this analysis.
  const connectivity = getSourcePortConnectivityMapFromCircuitJson(input)
  const net = (id: string) => connectivity.getNetConnectedToId(id) ?? id
  const grounds = new Set<string>()
  for (const element of input) {
    if (
      element.type === "source_net" &&
      (element.is_ground || element.name?.toLowerCase().includes("gnd"))
    )
      grounds.add(net(element.source_net_id))
    if (element.type === "source_port" && element.name?.toLowerCase() === "gnd")
      grounds.add(net(element.source_port_id))
    if (element.type === "simulation_voltage_source") {
      const negative =
        "negative_source_port_id" in element
          ? element.negative_source_port_id
          : "terminal2_source_port_id" in element
            ? element.terminal2_source_port_id
            : undefined
      if (negative) grounds.add(net(negative))
    }
  }
  const componentNets = new Map<string, string[]>()
  for (const port of ports) {
    if (!port.source_component_id) continue
    const nets = componentNets.get(port.source_component_id) ?? []
    const id = net(port.source_port_id)
    if (!grounds.has(id)) nets.push(id)
    componentNets.set(port.source_component_id, nets)
  }
  const reachable = new Set<string>()
  for (const probe of probes) {
    for (const [key, value] of Object.entries(probe)) {
      if (typeof value !== "string") continue
      if (key.endsWith("_source_port_id")) {
        const port = ports.find((p) => p.source_port_id === value)
        if (port?.source_component_id) included.add(port.source_component_id)
      }
      if (key.endsWith("_source_net_id") && !grounds.has(net(value)))
        reachable.add(net(value))
    }
  }
  let expanded = true
  while (expanded) {
    expanded = false
    for (const [id, nets] of componentNets) {
      if (!included.has(id) && !nets.some((n) => reachable.has(n))) continue
      if (!included.has(id)) {
        included.add(id)
        expanded = true
      }
      for (const n of nets)
        if (!reachable.has(n)) {
          reachable.add(n)
          expanded = true
        }
    }
  }
  const includedPorts = new Set(
    ports
      .filter(
        (p) => !p.source_component_id || included.has(p.source_component_id),
      )
      .map((p) => p.source_port_id),
  )
  const scoped = input
    .filter((element) => {
      if (
        "source_component_id" in element &&
        element.source_component_id &&
        !included.has(element.source_component_id)
      )
        return false
      if (element.type === "source_port")
        return includedPorts.has(element.source_port_id)
      if (element.type.startsWith("simulation_")) {
        for (const [key, value] of Object.entries(element)) {
          if (
            key.endsWith("_source_port_id") &&
            typeof value === "string" &&
            !includedPorts.has(value)
          )
            return false
        }
      }
      return true
    })
    .map((element) =>
      element.type === "source_component"
        ? {
            ...element,
            name: `${element.name.replace(/[^a-zA-Z0-9_]/g, "_")}__${element.source_component_id}`,
          }
        : element,
    )
  return circuitJsonToSpice(scoped).toSpiceString()
}
