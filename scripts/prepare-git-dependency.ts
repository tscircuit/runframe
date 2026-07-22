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
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"

const packageDirectory = path.resolve(import.meta.dirname, "..")

const resolveDependencyPackageJson = ({
  dependencyName,
  rootDirectory,
}: {
  dependencyName: string
  rootDirectory: string
}) => {
  const nestedPackageJsonPath = path.join(
    rootDirectory,
    "node_modules",
    ...dependencyName.split("/"),
    "package.json",
  )
  if (existsSync(nestedPackageJsonPath)) return nestedPackageJsonPath

  return Bun.resolveSync(`${dependencyName}/package.json`, rootDirectory)
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

const branchDependencies = [
  "circuit-json",
  "circuit-to-svg",
  "@tscircuit/schematic-viewer",
]

const buildWorkspaceDirectory = mkdtempSync(
  path.join(tmpdir(), "runframe-build-"),
)
const buildPackageDirectory = path.join(buildWorkspaceDirectory, "package")
const bundleOutputDirectory = path.join(buildWorkspaceDirectory, "bundles")
try {
  cpSync(packageDirectory, buildPackageDirectory, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = path.relative(packageDirectory, sourcePath)
      const topLevelEntry = relativePath.split(path.sep)[0]
      return ![".git", "cosmos-export", "dist", "node_modules"].includes(
        topLevelEntry,
      )
    },
  })

  runCommand({
    command: ["bun", "install", "--ignore-scripts", "--frozen-lockfile"],
    cwd: buildPackageDirectory,
  })

  for (const dependencyName of branchDependencies) {
    const packageJsonPath = resolveDependencyPackageJson({
      dependencyName,
      rootDirectory: buildPackageDirectory,
    })
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

  runCommand({
    command: ["bun", "run", "build:css"],
    cwd: buildPackageDirectory,
  })

  const bundleBuildEnvironment = {
    ...process.env,
    NODE_OPTIONS: "--max-old-space-size=8192",
    RUNFRAME_BUILD_OUTPUT: bundleOutputDirectory,
  }
  runCommand({
    command: ["bun", "run", "build:standalone"],
    cwd: buildPackageDirectory,
    env: bundleBuildEnvironment,
  })
  runCommand({
    command: ["bun", "run", "build:standalone-preview"],
    cwd: buildPackageDirectory,
    env: bundleBuildEnvironment,
  })

  runCommand({
    command: ["bun", "run", "build:lib"],
    cwd: buildPackageDirectory,
    env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=8192" },
  })

  publishDirectoryAtomically(
    path.join(buildPackageDirectory, "dist"),
    path.join(packageDirectory, "dist"),
  )
  publishDirectoryAtomically(
    bundleOutputDirectory,
    path.join(packageDirectory, "dist"),
  )
} finally {
  rmSync(buildWorkspaceDirectory, { recursive: true, force: true })
}
