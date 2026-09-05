/**
 * Regenerate the real board and SRJ captures for the Autorouting Cosmos fixture:
 *
 *   bun run scripts/generate-autorouting-fixture.ts
 *
 * Run with the repository's locked dependencies. The preview reads the checked-in
 * capture, so opening Cosmos never waits for a network request or an autorouter.
 */
import { Circuit } from "@tscircuit/core"
import { fileURLToPath } from "node:url"
import { createElement } from "react"
import AutoroutingSensor from "../examples/assets/autorouting-sensor"

const circuit = new Circuit({
  platform: { placementDrcChecksDisabled: true },
})
const events: unknown[] = []

for (const type of [
  "autorouting:start",
  "autorouting:end",
  "autorouting:error",
] as const) {
  circuit.on(type, (event) => {
    // Core may reuse its SRJ objects; preserve each event at the capture boundary.
    // Some core releases omit `type` on start payloads, so retain the channel.
    events.push({ ...structuredClone(event), type })
    console.log(type, event.componentDisplayName, event.phaseName ?? "")
  })
}

circuit.add(createElement(AutoroutingSensor))
await circuit.renderUntilSettled()

const circuitJson = circuit.getCircuitJson()
const typedEvents = events as Array<{ type: string }>
const startCount = typedEvents.filter(
  (event) => event.type === "autorouting:start",
).length
const endCount = typedEvents.filter(
  (event) => event.type === "autorouting:end",
).length

if (
  startCount < 2 ||
  startCount !== endCount ||
  typedEvents.some((event) => event.type === "autorouting:error")
) {
  throw new Error(
    `Expected at least two successful routing phases; got ${startCount} starts and ${endCount} outputs`,
  )
}

const packageJson = await Bun.file(
  new URL("../package.json", import.meta.resolve("@tscircuit/core")),
).json()
const outputUrl = new URL(
  "../examples/assets/autorouting-sensor.json",
  import.meta.url,
)

await Bun.write(
  outputUrl,
  `${JSON.stringify(
    {
      generatedWith: `@tscircuit/core@${packageJson.version}`,
      circuitJson,
      events,
    },
    null,
    2,
  )}\n`,
)

const formatting = Bun.spawnSync(
  [
    process.execPath,
    "x",
    "biome",
    "format",
    "--write",
    fileURLToPath(outputUrl),
  ],
  { stdout: "inherit", stderr: "inherit" },
)
if (formatting.exitCode !== 0) throw new Error("Could not format the recording")

console.log(
  `Saved ${circuitJson.length} circuit elements and ${endCount} routing phases to ${outputUrl.pathname}`,
)
