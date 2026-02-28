import type { ProjectConfig } from "@tscircuit/props"
import { projectConfig } from "@tscircuit/props"
import { Minimatch } from "minimatch"

const DEFAULT_BOARD_FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"]

const DEFAULT_BOARD_FILE_FILTER = (filename: string) =>
  DEFAULT_BOARD_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext)) &&
  !filename.endsWith(".d.ts")

const EXCLUDE_FILE_FROM_INCLUDED_BOARD_FILES_CONFIG = (filename: string) =>
  filename.endsWith(".json") && !filename.endsWith(".circuit.json")

const parseProjectConfig = (configContent?: string): ProjectConfig | null => {
  if (!configContent) return null

  try {
    const parsedJson = JSON.parse(configContent)
    return projectConfig.parse(parsedJson)
  } catch (error) {
    console.warn("Failed to parse tscircuit.config.json", error)
    return null
  }
}

export const getBoardFilesFromConfig = (
  files: string[],
  configContent?: string,
): string[] => {
  const parsedConfig = parseProjectConfig(configContent)
  const includeBoardFiles = parsedConfig?.includeBoardFiles?.filter(Boolean)

  if (includeBoardFiles && includeBoardFiles.length > 0) {
    const matchers = includeBoardFiles.map(
      (pattern) => new Minimatch(pattern, { dot: true }),
    )

    return files.filter(
      (file) =>
        DEFAULT_BOARD_FILE_FILTER(file) ||
        (matchers.some((matcher) => matcher.match(file)) &&
          !EXCLUDE_FILE_FROM_INCLUDED_BOARD_FILES_CONFIG(file)),
    )
  }

  return files.filter(DEFAULT_BOARD_FILE_FILTER)
}
