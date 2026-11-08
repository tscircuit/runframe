import { join } from "node:path"

type Manifest = {
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

type Requirement = { source: string; range: string }

export function getPeerRequirements(
  manifest: Manifest,
): Record<string, string> {
  const peers = { ...manifest.peerDependencies }
  // Core's wildcard props peer omits its runtime API requirement. Use the
  // published build's props version as a floor until upstream tightens it.
  if (peers["@tscircuit/props"] === "*") {
    const testedProps = manifest.devDependencies?.["@tscircuit/props"]
    const match = testedProps?.match(/^[~^]?(\d+\.\d+\.\d+)$/)
    if (match) peers["@tscircuit/props"] = `>=${match[1]}`
  }
  return peers
}

export function selectCompatibleVersion(
  versions: string[],
  requirements: Requirement[],
): string {
  const version = versions
    .filter(
      (candidate) =>
        /^\d+\.\d+\.\d+$/.test(candidate) &&
        requirements.every(({ range }) =>
          Bun.semver.satisfies(candidate, range),
        ),
    )
    .sort(Bun.semver.order)[0]
  if (!version) {
    throw new Error(
      `No compatible stable version: ${requirements.map(({ source, range }) => `${source} requires ${range}`).join(", ")}`,
    )
  }
  return version
}

export async function repairPeerDependencies(options: {
  readRoot: () => Promise<Manifest>
  readInstalled: (name: string) => Promise<Manifest>
  getVersions: (name: string) => Promise<string[]>
  install: (name: string, version: string) => Promise<void>
}): Promise<string[]> {
  const summary: string[] = []
  // Re-read after each install: repairing core can introduce a props requirement.
  for (let round = 0; round < 20; round++) {
    const root = await options.readRoot()
    const direct = { ...root.devDependencies, ...root.dependencies }
    const manifests = await Promise.all(
      Object.keys(direct).map(
        async (name) => [name, await options.readInstalled(name)] as const,
      ),
    )
    const requirements = new Map<string, Requirement[]>()
    for (const [source, manifest] of manifests) {
      for (const [name, range] of Object.entries(
        getPeerRequirements(manifest),
      )) {
        // Only repair existing first-party dependencies. Do not introduce all
        // of core's optional integrations or upgrade unrelated third-party APIs.
        if (!(name in direct) || !name.startsWith("@tscircuit/")) continue
        const entries = requirements.get(name) ?? []
        entries.push({ source, range })
        requirements.set(name, entries)
      }
    }
    let repaired = false
    for (const [name, constraints] of requirements) {
      const current = manifests.find(
        ([packageName]) => packageName === name,
      )?.[1].version
      if (!current) throw new Error(`Missing installed version for ${name}`)
      if (
        constraints.every(({ range }) => Bun.semver.satisfies(current, range))
      )
        continue
      const version = selectCompatibleVersion(
        await options.getVersions(name),
        constraints,
      )
      if (Bun.semver.order(version, current) < 0) {
        throw new Error(
          `Repairing ${name} would downgrade ${current} to ${version}; resolve the conflicting requirements manually`,
        )
      }
      summary.push(
        `- ${name}: ${current} → ${version} (${constraints.map(({ source, range }) => `${source}: ${range}`).join("; ")})`,
      )
      await options.install(name, version)
      repaired = true
      break
    }
    if (!repaired) return summary
  }
  throw new Error(
    "Dependency compatibility repair did not converge after 20 updates",
  )
}

export function parsePackageNames(input: string): string[] {
  const names = [
    ...new Set(
      input
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean),
    ),
  ]
  if (
    !names.length ||
    names.some(
      (name) => !/^(@[a-z0-9][a-z0-9_.-]*\/)?[a-z0-9][a-z0-9_.-]*$/.test(name),
    )
  ) {
    throw new Error(
      "Provide comma-separated package names, without versions or flags",
    )
  }
  return names
}

if (import.meta.main) {
  const rootPath = join(import.meta.dir, "../package.json")
  const readRoot = () => Bun.file(rootPath).json() as Promise<Manifest>
  const requested = parsePackageNames(process.env.PACKAGE_NAMES ?? "")
  const root = await readRoot()
  for (const name of requested) {
    if (!root.dependencies?.[name] && !root.devDependencies?.[name]) {
      throw new Error(`Requested package is not a direct dependency: ${name}`)
    }
  }
  const run = async (args: string[]) => {
    const child = Bun.spawn([process.execPath, ...args], {
      cwd: join(import.meta.dir, ".."),
      stdout: "inherit",
      stderr: "inherit",
    })
    if ((await child.exited) !== 0)
      throw new Error(`bun ${args.join(" ")} failed`)
  }
  await run(["update", "--latest", "--no-cache", ...requested])
  const changes = await repairPeerDependencies({
    readRoot,
    readInstalled: (name) =>
      Bun.file(
        join(import.meta.dir, "../node_modules", name, "package.json"),
      ).json(),
    getVersions: async (name) => {
      const response = await fetch(
        `https://registry.npmjs.org/${encodeURIComponent(name)}`,
        {
          headers: { "Cache-Control": "no-cache" },
        },
      )
      if (!response.ok)
        throw new Error(
          `Registry lookup for ${name} failed: ${response.status}`,
        )
      const metadata = (await response.json()) as {
        versions: Record<string, unknown>
      }
      return Object.keys(metadata.versions)
    },
    install: (name, version) =>
      run(["update", "--no-cache", `${name}@${version}`]),
  })
  const summary = [
    `Updated requested packages: ${requested.join(", ")}.`,
    "",
    ...changes,
    "",
    "Validated with Bun tests, TypeScript, and the full build before opening this PR.",
  ].join("\n")
  if (process.env.UPDATE_SUMMARY_PATH) {
    await Bun.write(process.env.UPDATE_SUMMARY_PATH, summary)
  }
}
