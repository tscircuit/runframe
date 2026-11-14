import { expect, test } from "bun:test"
import { Circuit } from "@tscircuit/core"

// Exercise the native API used by generated circuits, including the waveform
// enum, resistive DC bias, grounded returns and pin mapping. No network needed.
const source = ".SUBCKT BUFFER 1 2 3\nE1 2 3 1 3 1\n.ENDS BUFFER"
const Chip = ({ simulate = false }: { simulate?: boolean }) => (
  <chip
    name="U1"
    pinLabels={{ pin1: "IN", pin2: "OUT", pin3: "GND" }}
    footprint={
      <footprint>
        {[1, 2, 3].map((pin) => (
          <smtpad
            key={pin}
            portHints={[String(pin)]}
            pcbX={pin * 2}
            pcbY={0}
            width={1}
            height={1}
            shape="rect"
          />
        ))}
      </footprint>
    }
    spiceModel={simulate ? <spicemodel source={source} /> : undefined}
  />
)

test("simulation groups use native biased stimuli and reference groups do not start a simulation", async () => {
  for (const simulate of [false, true]) {
    const netlists: string[] = []
    const circuit = new Circuit({
      platform: {
        spiceEngineMap: {
          ngspice: {
            simulate: async (netlist: string) => {
              netlists.push(netlist)
              return { simulationResultCircuitJson: [] }
            },
          },
        },
      },
    })
    circuit.add(
      <board pcbDisabled routingDisabled>
        <group name="Example" subcircuit>
          <net name="GND" />
          <Chip simulate={simulate} />
          <trace from=".U1 > .pin3" to="net.GND" />
          {simulate ? (
            <>
              <voltagesource
                name="VBIAS"
                voltage="3V"
                connections={{ pin1: "net.BIAS", pin2: "net.GND" }}
              />
              <voltagesource
                name="VIN"
                waveShape="sinewave"
                voltage="0.5V"
                frequency="1kHz"
                connections={{ pin1: "net.SIGNAL", pin2: "net.GND" }}
              />
              <resistor
                name="RBIAS"
                resistance="10k"
                footprint="0402"
                connections={{ pin1: "net.BIAS", pin2: ".U1 > .pin1" }}
              />
              <resistor
                name="RSIGNAL"
                resistance="10k"
                footprint="0402"
                connections={{ pin1: "net.SIGNAL", pin2: ".U1 > .pin1" }}
              />
              <voltageprobe
                name="OUT"
                connectsTo=".U1 > .pin2"
                referenceTo="net.GND"
              />
              <analogsimulation
                duration="2ms"
                timePerStep="2us"
                spiceEngine="ngspice"
              />
            </>
          ) : (
            <net name="INPUT" connectsTo=".U1 > .pin1" />
          )}
        </group>
      </board>,
    )
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    expect(json.filter((x) => x.type.endsWith("_error"))).toEqual([])
    expect(json.filter((x) => x.type === "simulation_experiment")).toHaveLength(
      simulate ? 1 : 0,
    )
    const models = json.filter((x) => x.type === "simulation_spice_subcircuit")
    expect(models).toHaveLength(simulate ? 1 : 0)
    expect(netlists).toHaveLength(simulate ? 1 : 0)
    if (simulate) {
      expect(netlists[0]).toMatch(/SIN\(0 0\.5 1000/)
      expect(netlists[0]).toContain("DC 3")
      // Floating voltage-source returns are grounded by the current converter;
      // a series bias source can otherwise silently become a nonzero V(0, 0).
      for (const line of netlists[0]
        .split("\n")
        .filter((line) => /^V/i.test(line))) {
        const [, positive, negative] = line.split(/\s+/)
        expect(positive).not.toBe(negative)
        expect(negative).toBe("0")
      }
      expect(netlists[0]).toContain(".SUBCKT BUFFER")
      expect(Object.keys(models[0].spice_pin_to_source_port_map)).toEqual([
        "1",
        "2",
        "3",
      ])
    }
  }
})
