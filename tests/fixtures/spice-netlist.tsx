import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"
import { registerDynamicModule } from "@tscircuit/internal-dynamic-import"
import * as converter from "circuit-json-to-spice"
import * as connectivity from "circuit-json-to-connectivity-map"
import type { AnyCircuitElement } from "circuit-json"
import { circuitJsonToSpice } from "circuit-json-to-spice"
import { prepareSpiceNetlist } from "../../lib/simulation/prepare-spice-netlist"

registerDynamicModule("circuit-json-to-spice@0.0.45", converter)
registerDynamicModule("circuit-json-to-connectivity-map@0.0.22", connectivity)

const Section = ({
  name,
  simulate = false,
}: { name: string; simulate?: boolean }) => (
  <group name={name} subcircuit>
    <net name="GND" />
    {simulate && (
      <voltagesource
        name="V1"
        voltage="5V"
        connections={{ pin1: ".R1 > .pin1", pin2: "net.GND" }}
      />
    )}
    <resistor
      name="R1"
      resistance="1k"
      footprint="0402"
      connections={{ pin2: ".C1 > .pin1" }}
    />
    <capacitor
      name="C1"
      capacitance="100nF"
      footprint="0402"
      connections={{ pin2: "net.GND" }}
    />
    {simulate && (
      <>
        <voltageprobe
          name="OUT"
          connectsTo=".C1 > .pin1"
          referenceTo="net.GND"
        />
        <analogsimulation
          duration="2ms"
          timePerStep="2us"
          spiceEngine="ngspice"
        />
      </>
    )}
  </group>
)

const project = async (secondSimulation = false) => {
  const requests: string[] = []
  const circuit = new Circuit({
    platform: {
      spiceEngineMap: {
        ngspice: {
          simulate: async (source: string) => {
            requests.push(source)
            return { simulationResultCircuitJson: [] }
          },
        },
      },
    },
  })
  circuit.add(
    <board pcbDisabled routingDisabled>
      <capacitor name="C1" capacitance="10uF" footprint="0402" />
      <Section name="First" simulate />
      <Section name="Second" simulate={secondSimulation} />
    </board>,
  )
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  expect(json.filter((e) => e.type.endsWith("_error"))).toEqual([])
  return { json, requests }
}
const capacitors = (source: string) =>
  source.split("\n").filter((line) => /^C\S+\s/i.test(line))

test("board-wide analysis preserves every same-named capacitor with a unique SPICE identity", async () => {
  const { json } = await project()
  const root = json.find(
    (e) => e.type === "source_group" && !e.parent_source_group_id,
  )!
  const input = json.map((e) =>
    e.type === "simulation_voltage_probe"
      ? { ...e, subcircuit_id: (root as any).subcircuit_id }
      : e,
  )
  const original = circuitJsonToSpice(input).toSpiceString()
  expect(
    capacitors(original).filter((line) => /^CC1\s/i.test(line)),
  ).toHaveLength(3)
  const fixed = await prepareSpiceNetlist(input, original)
  const names = capacitors(fixed).map((line) =>
    line.split(/\s/)[0].toLowerCase(),
  )
  expect(names).toHaveLength(3)
  expect(new Set(names).size).toBe(3)
  expect(
    capacitors(fixed).filter((line) => line.endsWith("100N")),
  ).toHaveLength(2)
  expect(capacitors(fixed).filter((line) => line.endsWith("10U"))).toHaveLength(
    1,
  )
})

test("a generated simulation excludes unrelated reference circuitry without editing project labels", async () => {
  const { json, requests } = await project()
  const before = JSON.stringify(json)
  expect(requests.length).toBeGreaterThan(0)
  for (const original of requests) {
    const fixed = await prepareSpiceNetlist(json, original)
    expect(fixed).not.toBe(original)
    expect(capacitors(fixed)).toHaveLength(1)
    expect(fixed).toContain("simulation_voltage_probe_0")
    expect(fixed).toContain(".tran 0.000002 0.002")
  }
  expect(JSON.stringify(json)).toBe(before)
  expect(
    json.filter((e) => e.type === "source_component" && e.name === "C1"),
  ).toHaveLength(3)
})

test("a component wired across the group boundary remains part of the simulation", async () => {
  const { json } = await project()
  const capacitors = json.filter(
    (e) => e.type === "source_component" && e.name === "C1",
  )
  const ids = capacitors
    .slice(0, 2)
    .map(
      (component) =>
        json.find(
          (e) =>
            e.type === "source_port" &&
            e.source_component_id === component.source_component_id &&
            e.pin_number === 1,
        )!,
    )
  json.push({
    type: "source_trace",
    source_trace_id: "external_connection",
    connected_source_port_ids: ids.map((port: any) => port.source_port_id),
    connected_source_net_ids: [],
  } as AnyCircuitElement)
  const raw = circuitJsonToSpice(json).toSpiceString()
  const fixed = await prepareSpiceNetlist(json, raw)
  const lines = fixed.split("\n").filter((line) => /^CC1__/i.test(line))
  expect(lines).toHaveLength(2)
  expect(lines.map((line) => line.trim().split(/\s+/)[1])[0]).toBe(
    lines.map((line) => line.trim().split(/\s+/)[1])[1],
  )
})

test("multiple simulations each retain their own probe and circuit", async () => {
  const { json, requests } = await project(true)
  const seen = new Set<string>()
  for (const original of requests) {
    const fixed = await prepareSpiceNetlist(json, original)
    expect(capacitors(fixed)).toHaveLength(1)
    const probe = /simulation_voltage_probe_\d+/.exec(fixed)?.[0]
    expect(probe).toBeDefined()
    seen.add(probe!)
  }
  expect(seen.size).toBe(2)
})

test("custom requests and parameter sweeps pass through without changing analysis values", async () => {
  const { json, requests } = await project()
  const raw = requests[0]
  for (const custom of [
    raw.replace(".tran", ".tran 99"),
    raw + "\n* custom request",
    "* no metadata\n.END",
    "* tscircuit_probe {broken\n.END",
  ])
    expect(await prepareSpiceNetlist(json, custom)).toBe(custom)
  const experiment = json.find((e) => e.type === "simulation_experiment")!
  const sweep = {
    type: "simulation_parameter_sweep",
    simulation_experiment_id: (experiment as any).simulation_experiment_id,
  } as AnyCircuitElement
  expect(await prepareSpiceNetlist([...json, sweep], raw)).toBe(raw)
})
