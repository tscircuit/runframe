import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const packageDirectory = path.resolve(import.meta.dirname, "..")

const runCommand = ({
  command,
  cwd,
  env = process.env,
}: {
  command: string[]
  cwd: string
  env?: Record<string, string | undefined>
}) => {
  const result = Bun.spawnSync({
    cmd: command,
    cwd,
    env,
    stdout: "inherit",
    stderr: "inherit",
  })

  if (result.exitCode !== 0) {
    throw new Error(
      `Command failed with exit code ${result.exitCode}: ${command.join(" ")}`,
    )
  }
}

runCommand({
  command: ["bun", "install", "--ignore-scripts", "--frozen-lockfile"],
  cwd: packageDirectory,
})

const branchDependencies = [
  "circuit-json",
  "circuit-to-svg",
  "@tscircuit/schematic-viewer",
]

for (const dependencyName of branchDependencies) {
  const packageJsonPath = Bun.resolveSync(
    `${dependencyName}/package.json`,
    packageDirectory,
  )
  const dependencyDirectory = path.dirname(packageJsonPath)
  const dependencyPackage = JSON.parse(readFileSync(packageJsonPath, "utf8"))
  const hasDeclarations = ["index.d.mts", "index.d.ts"].some((fileName) =>
    existsSync(path.join(dependencyDirectory, "dist", fileName)),
  )
  if (!dependencyPackage.scripts?.prepare || hasDeclarations) continue

  runCommand({
    command: ["bun", "run", "prepare"],
    cwd: dependencyDirectory,
  })
}

runCommand({ command: ["bun", "run", "build:css"], cwd: packageDirectory })
runCommand({
  command: ["bun", "run", "build:standalone"],
  cwd: packageDirectory,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
})
runCommand({
  command: ["bun", "run", "build:standalone-preview"],
  cwd: packageDirectory,
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
})

const stagingDirectory = mkdtempSync(path.join(tmpdir(), "runframe-build-"))
try {
  cpSync(
    path.join(packageDirectory, "lib"),
    path.join(stagingDirectory, "lib"),
    {
      recursive: true,
    },
  )
  cpSync(
    path.join(packageDirectory, "package.json"),
    path.join(stagingDirectory, "package.json"),
  )
  cpSync(
    path.join(packageDirectory, "tsconfig.json"),
    path.join(stagingDirectory, "tsconfig.json"),
  )
  symlinkSync(
    path.join(packageDirectory, "node_modules"),
    path.join(stagingDirectory, "node_modules"),
    "dir",
  )
  runCommand({
    command: ["bun", "run", "build:lib"],
    cwd: stagingDirectory,
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
  })
  cpSync(
    path.join(stagingDirectory, "dist"),
    path.join(packageDirectory, "dist"),
    { recursive: true },
  )
} finally {
  rmSync(stagingDirectory, { recursive: true, force: true })
}
