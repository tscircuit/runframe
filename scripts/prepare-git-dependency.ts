import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const packageDirectory = path.resolve(import.meta.dirname, "..")

const resolveDependencyPackageJson = (dependencyName: string) => {
  const nestedPackageJsonPath = path.join(
    packageDirectory,
    "node_modules",
    ...dependencyName.split("/"),
    "package.json",
  )
  if (existsSync(nestedPackageJsonPath)) return nestedPackageJsonPath

  return Bun.resolveSync(`${dependencyName}/package.json`, packageDirectory)
}

const publishDirectoryAtomically = (
  sourceDirectory: string,
  destinationDirectory: string,
) => {
  mkdirSync(destinationDirectory, { recursive: true })

  for (const entry of readdirSync(sourceDirectory, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDirectory, entry.name)
    const destinationPath = path.join(destinationDirectory, entry.name)
    if (entry.isDirectory()) {
      publishDirectoryAtomically(sourcePath, destinationPath)
      continue
    }

    const temporaryPath = path.join(
      destinationDirectory,
      `.${entry.name}.${process.pid}.tmp`,
    )
    copyFileSync(sourcePath, temporaryPath)
    renameSync(temporaryPath, destinationPath)
  }
}

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
  const packageJsonPath = resolveDependencyPackageJson(dependencyName)
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

const bundleStagingDirectory = mkdtempSync(
  path.join(tmpdir(), "runframe-bundles-"),
)
const libraryStagingDirectory = mkdtempSync(
  path.join(tmpdir(), "runframe-library-"),
)
const bundleOutputDirectory = path.join(bundleStagingDirectory, "dist")
try {
  const bundleBuildEnvironment = {
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=8192",
    RUNFRAME_BUILD_OUTPUT: bundleOutputDirectory,
  }
  runCommand({
    command: ["bun", "run", "build:standalone"],
    cwd: packageDirectory,
    env: bundleBuildEnvironment,
  })
  runCommand({
    command: ["bun", "run", "build:standalone-preview"],
    cwd: packageDirectory,
    env: bundleBuildEnvironment,
  })

  cpSync(
    path.join(packageDirectory, "lib"),
    path.join(libraryStagingDirectory, "lib"),
    {
      recursive: true,
    },
  )
  cpSync(
    path.join(packageDirectory, "package.json"),
    path.join(libraryStagingDirectory, "package.json"),
  )
  cpSync(
    path.join(packageDirectory, "tsconfig.json"),
    path.join(libraryStagingDirectory, "tsconfig.json"),
  )
  symlinkSync(
    path.join(packageDirectory, "node_modules"),
    path.join(libraryStagingDirectory, "node_modules"),
    "dir",
  )
  runCommand({
    command: ["bun", "run", "build:lib"],
    cwd: libraryStagingDirectory,
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
  })

  publishDirectoryAtomically(
    path.join(libraryStagingDirectory, "dist"),
    path.join(packageDirectory, "dist"),
  )
  publishDirectoryAtomically(
    bundleOutputDirectory,
    path.join(packageDirectory, "dist"),
  )
} finally {
  rmSync(bundleStagingDirectory, { recursive: true, force: true })
  rmSync(libraryStagingDirectory, { recursive: true, force: true })
}
