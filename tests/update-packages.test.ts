import { expect, test } from "bun:test"
import {
  getPeerRequirements,
  parsePackageNames,
  repairPeerDependencies,
  selectCompatibleVersion,
} from "../scripts/update-packages"

test("viewer update repairs core and then props without updating unrelated packages", async () => {
  const manifests: Record<string, Parameters<typeof getPeerRequirements>[0]> = {
    "@tscircuit/3d-viewer": {
      version: "0.0.643",
      peerDependencies: { "@tscircuit/core": ">=0.0.2234" },
    },
    "@tscircuit/core": { version: "0.0.1911" },
    "@tscircuit/props": { version: "0.0.702" },
    "@tscircuit/eval": {
      version: "0.0.1706",
      peerDependencies: { "@tscircuit/core": ">=0.0.1906" },
    },
  }
  const installs: string[] = []
  const readRoot = async () => ({
    dependencies: { "@tscircuit/core": "^0.0.1911" },
    devDependencies: {
      "@tscircuit/3d-viewer": "^0.0.643",
      "@tscircuit/props": "^0.0.702",
      "@tscircuit/eval": "0.0.1706",
    },
  })
  const summary = await repairPeerDependencies({
    readRoot,
    readInstalled: async (name) => manifests[name],
    getVersions: async (name) =>
      name === "@tscircuit/core"
        ? ["0.0.2292", "0.0.2234", "0.0.2233"]
        : ["0.0.721", "0.0.714", "0.0.713"],
    install: async (name, version) => {
      installs.push(`${name}@${version}`)
      manifests[name] = {
        version,
        ...(name === "@tscircuit/core"
          ? {
              peerDependencies: { "@tscircuit/props": "*" },
              devDependencies: { "@tscircuit/props": "^0.0.714" },
            }
          : {}),
      }
    },
  })
  expect(installs).toEqual([
    "@tscircuit/core@0.0.2234",
    "@tscircuit/props@0.0.714",
  ])
  expect(summary).toHaveLength(2)
  expect(summary[1]).toContain("@tscircuit/core: >=0.0.714")
})

test("keeps compatible dependencies and does not introduce absent integrations", async () => {
  await repairPeerDependencies({
    readRoot: async () => ({ dependencies: { "@tscircuit/core": "0.0.2234" } }),
    readInstalled: async () => ({
      version: "0.0.2234",
      peerDependencies: { "@tscircuit/props": "*", react: "19.1.0" },
      devDependencies: { "@tscircuit/props": "^0.0.714" },
    }),
    getVersions: async () => {
      throw new Error("Unexpected registry lookup")
    },
    install: async () => {
      throw new Error("Unexpected update")
    },
  })
})

test("selects the smallest stable version satisfying every direct consumer", () => {
  expect(
    selectCompatibleVersion(
      ["0.0.715-beta.1", "0.0.714", "0.0.716", "0.0.715"],
      [
        { source: "viewer", range: ">=0.0.714" },
        { source: "core", range: ">=0.0.715" },
      ],
    ),
  ).toBe("0.0.715")
  expect(() =>
    selectCompatibleVersion(
      ["0.0.714", "0.0.715"],
      [
        { source: "viewer", range: ">=0.0.715" },
        { source: "core", range: "0.0.714" },
      ],
    ),
  ).toThrow("No compatible stable version")
})

test("props build floor accepts newer props and preserves explicit peer ranges", () => {
  expect(
    getPeerRequirements({
      peerDependencies: { "@tscircuit/props": "*" },
      devDependencies: { "@tscircuit/props": "^0.0.714" },
    })["@tscircuit/props"],
  ).toBe(">=0.0.714")
  expect(
    getPeerRequirements({
      peerDependencies: { "@tscircuit/props": ">=0.0.720" },
      devDependencies: { "@tscircuit/props": "^0.0.714" },
    })["@tscircuit/props"],
  ).toBe(">=0.0.720")
})

test("parses package input without allowing flags, versions, or paths", () => {
  expect(
    parsePackageNames(" @tscircuit/core, @tscircuit/core, circuit-json "),
  ).toEqual(["@tscircuit/core", "circuit-json"])
  for (const value of ["", "--force", "../package", "@tscircuit/core@latest"]) {
    expect(() => parsePackageNames(value)).toThrow()
  }
})

test("fails instead of downgrading an explicitly updated dependency", async () => {
  await expect(
    repairPeerDependencies({
      readRoot: async () => ({
        dependencies: {
          "@tscircuit/core": "0.0.2234",
          "@tscircuit/3d-viewer": "0.0.643",
        },
      }),
      readInstalled: async (name) =>
        name === "@tscircuit/core"
          ? { version: "0.0.2234" }
          : {
              version: "0.0.643",
              peerDependencies: { "@tscircuit/core": "0.0.1911" },
            },
      getVersions: async () => ["0.0.1911", "0.0.2234"],
      install: async () => {
        throw new Error("Must not install a downgrade")
      },
    }),
  ).rejects.toThrow("would downgrade")
})
