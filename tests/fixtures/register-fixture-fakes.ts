import { plugin } from "bun"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("../../", import.meta.url))

// Load explicit fake services before the isolated fixture imports the UI.
export const registerFixtureFakes = (
  services: Record<string, Record<string, unknown>>,
) => {
  plugin({
    name: "runframe-fixture-fakes",
    setup(builder) {
      for (const [name, exports] of Object.entries(services)) {
        const load = () => ({ loader: "object" as const, exports })
        builder.module(name, load)
        builder.module(Bun.resolveSync(name, projectRoot), load)
      }
    },
  })
}
