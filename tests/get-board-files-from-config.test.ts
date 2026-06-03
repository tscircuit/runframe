import { describe, expect, test } from "bun:test"

import { getBoardFilesFromConfig } from "../lib/utils/get-board-files-from-config"

const stringifyConfig = (config: unknown) => JSON.stringify(config, null, 2)

describe("getBoardFilesFromConfig", () => {
  test("returns files matching includeBoardFiles globs", () => {
    const files = [
      "src/boards/main.board.tsx",
      "src/boards/helper.ts",
      "src/.hidden/secret.board.tsx",
    ]

    const config = stringifyConfig({
      includeBoardFiles: ["**/*.board.tsx", "**/.hidden/*.board.tsx"],
    })

    expect(getBoardFilesFromConfig(files, config)).toEqual([
      "src/boards/main.board.tsx",
      "src/.hidden/secret.board.tsx",
    ])
  })

  test("prefers runtime includeBoardFiles over synced json config", () => {
    const files = [
      "json-config/main.board.tsx",
      "runtime-config/main.board.tsx",
      "src/fallback.tsx",
    ]

    const config = stringifyConfig({
      includeBoardFiles: ["json-config/**/*.board.tsx"],
    })

    expect(
      getBoardFilesFromConfig(files, config, {
        includeBoardFiles: ["runtime-config/**/*.board.tsx"],
      }),
    ).toEqual(["runtime-config/main.board.tsx"])
  })

  test("falls back to default file extensions when config is missing", () => {
    const files = [
      "src/board.tsx",
      "src/board-helper.d.ts",
      "src/board.js",
      "src/board.txt",
    ]

    expect(getBoardFilesFromConfig(files)).toEqual([
      "src/board.tsx",
      "src/board.js",
    ])
  })
})
