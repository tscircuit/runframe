import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { deduplicateSimulationGraphs } from "../lib/simulation/deduplicate-simulation-graphs"

test("identical nested experiment results appear once and trace references remain valid", () => {
  const graph = {
    type: "simulation_transient_voltage_graph",
    simulation_transient_voltage_graph_id: "graph_0",
    simulation_experiment_id: "experiment_0",
    source_probe_id: "probe_0",
    name: "OUT",
    voltage_levels: [1, 2, 3],
    time_per_step: 0.002,
  }
  const trace = {
    type: "simulation_oscilloscope_trace",
    simulation_oscilloscope_trace_id: "trace_0",
    simulation_transient_voltage_graph_id: "graph_0",
    volts_per_div: 1,
  }
  const json = [
    graph,
    { ...graph, simulation_transient_voltage_graph_id: "graph_1" },
    trace,
    {
      ...trace,
      simulation_oscilloscope_trace_id: "trace_1",
      simulation_transient_voltage_graph_id: "graph_1",
    },
    {
      ...trace,
      simulation_oscilloscope_trace_id: "trace_2",
      simulation_transient_voltage_graph_id: "graph_1",
      volts_per_div: 2,
    },
  ] as AnyCircuitElement[]
  const before = JSON.stringify(json)
  const result = deduplicateSimulationGraphs(json)
  expect(result).toHaveLength(3)
  expect(
    result.filter((e) => e.type === "simulation_transient_voltage_graph"),
  ).toHaveLength(1)
  expect(
    result
      .filter((e) => e.type === "simulation_oscilloscope_trace")
      .map((e) => e.simulation_transient_voltage_graph_id),
  ).toEqual(["graph_0", "graph_0"])
  expect(JSON.stringify(json)).toBe(before)
})

test("different experiments, probes and sweep values remain distinct", () => {
  const graph = {
    type: "simulation_transient_voltage_graph",
    simulation_transient_voltage_graph_id: "graph_0",
    simulation_experiment_id: "experiment_0",
    source_probe_id: "probe_0",
    name: "OUT",
    voltage_levels: [1, 2, 3],
    time_per_step: 0.002,
  }
  const json = [
    graph,
    {
      ...graph,
      simulation_transient_voltage_graph_id: "graph_1",
      simulation_experiment_id: "experiment_1",
    },
    {
      ...graph,
      simulation_transient_voltage_graph_id: "graph_2",
      source_probe_id: "probe_1",
    },
    {
      ...graph,
      simulation_transient_voltage_graph_id: "graph_3",
      voltage_levels: [2, 3, 4],
    },
  ] as AnyCircuitElement[]
  expect(deduplicateSimulationGraphs(json)).toBe(json)
})
