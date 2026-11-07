import { expect, test } from "bun:test"
import { mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("published package resolves without direct JS CDN dependencies", async () => {
  const auditDir = await mkdtemp(join(tmpdir(), "runframe-dependency-audit-"))
  const packDir = join(auditDir, "pack")
  const installDir = join(auditDir, "install")
  const npmEnv = {
    ...process.env,
    npm_config_cache: join(auditDir, "npm-cache"),
  }

  const runNpm = async (cwd: string, args: string[]) => {
    const process = Bun.spawn(["npm", ...args], {
      cwd,
      env: npmEnv,
      stdout: "pipe",
      stderr: "pipe",
    })
    const [exitCode, stdout, stderr] = await Promise.all([
      process.exited,
      new Response(process.stdout).text(),
      new Response(process.stderr).text(),
    ])
    expect(exitCode, stderr).toBe(0)
    return stdout
  }

  try {
    await mkdir(packDir)
    await mkdir(installDir)

    const [packed] = JSON.parse(
      await runNpm(join(import.meta.dir, ".."), [
        "pack",
        "--ignore-scripts",
        "--json",
        "--pack-destination",
        packDir,
      ]),
    ) as { filename: string }[]

    await Bun.write(
      join(installDir, "package.json"),
      JSON.stringify({ private: true }),
    )
    await runNpm(installDir, [
      "install",
      "--package-lock-only",
      "--ignore-scripts",
      "--no-audit",
      "--no-fund",
      join(packDir, packed.filename),
    ])

    const lockfile = (await Bun.file(
      join(installDir, "package-lock.json"),
    ).json()) as { packages: Record<string, { resolved?: string }> }
    const cdnDependencies = Object.entries(lockfile.packages)
      .filter(([, pkg]) =>
        pkg.resolved?.startsWith("https://jscdn.tscircuit.com/"),
      )
      .map(([path, pkg]) => ({ path, resolved: pkg.resolved }))

    expect(cdnDependencies).toEqual([])
  } finally {
    await rm(auditDir, { recursive: true, force: true })
  }
}, 60_000)
