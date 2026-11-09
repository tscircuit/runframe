import { expect, test } from "bun:test"
import { referenceDesignManifestSchema } from "../lib/reference-designs"

test("reference design manifests reject duplicate presets, unsafe paths and non-JSON props", () => {
  const configuration = {
    name: "full_board",
    display_name: "Full board",
    props: {},
    circuit_json_path: "dist/timer/full_board/circuit.json",
    pcb_svg_path: "dist/timer/full_board/pcb.svg",
    schematic_svg_path: "dist/timer/full_board/schematic.svg",
    glb_path: "dist/timer/full_board/3d.glb",
    circuit_json_sha256: "0".repeat(64),
    glb_sha256: "0".repeat(64),
  }
  const design = {
    name: "timer",
    display_name: "Timer",
    chip_names: ["NE555DR"],
    component_path: "index.circuit.tsx",
    props_schema: {},
    configurations: [configuration],
  }
  const manifest = { schema_version: 1, reference_designs: [design] }
  expect(referenceDesignManifestSchema.safeParse(manifest).success).toBe(true)
  for (const invalid of [
    { ...design, configurations: [configuration, configuration] },
    { ...design, component_path: "../index.circuit.tsx" },
    {
      ...design,
      configurations: [
        { ...configuration, glb_path: "https://other.example/model.glb" },
      ],
    },
    {
      ...design,
      configurations: [{ ...configuration, props: { frequency: Number.NaN } }],
    },
  ])
    expect(
      referenceDesignManifestSchema.safeParse({
        ...manifest,
        reference_designs: [invalid],
      }).success,
    ).toBe(false)
})
