import type { ProjectConfig } from "@tscircuit/props"
import { projectConfig } from "@tscircuit/props"
import micromatch from "micromatch"

const DEFAULT_BOARD_FILE_EXTENSIONS = [
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".circuit.json",
]

const DEFAULT_BOARD_FILE_FILTER = (filename: string) =>
  DEFAULT_BOARD_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext)) &&
  !filename.endsWith(".d.ts")

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
    return micromatch(files, includeBoardFiles, {
      dot: true,
    })
  }

  return files.filter(DEFAULT_BOARD_FILE_FILTER)
}
