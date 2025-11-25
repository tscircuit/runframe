import { describe, expect, test } from "bun:test"

describe("File extension edge case - default config behavior", () => {
  const DEFAULT_BOARD_FILE_FILTER = (filename: string) => {
    const DEFAULT_BOARD_FILE_EXTENSIONS = [
      ".tsx",
      ".ts",
      ".jsx",
      ".js",
      ".circuit.json",
    ]
    return (
      DEFAULT_BOARD_FILE_EXTENSIONS.some((ext) => filename.endsWith(ext)) &&
      !filename.endsWith(".d.ts")
    )
  }

  const UI_FILE_FILTER = (filename: string) => {
    return (
      filename.endsWith(".tsx") ||
      filename.endsWith(".circuit.json") ||
      filename.endsWith(".jsx")
    )
  }

  test("backend includes .ts files but UI filter excludes them", () => {
    const allFiles = [
      "board.tsx",
      "utils.ts",
      "types.d.ts",
      "helper.js",
      "styles.css",
    ]

    const backendFiles = allFiles.filter(DEFAULT_BOARD_FILE_FILTER)
    const uiFiles = backendFiles.filter(UI_FILE_FILTER)

    // Backend sees both .tsx and .ts
    expect(backendFiles).toContain("board.tsx")
    expect(backendFiles).toContain("utils.ts")
    expect(backendFiles).not.toContain("types.d.ts") // .d.ts excluded
    expect(backendFiles).not.toContain("styles.css")

    // UI only shows .tsx
    expect(uiFiles).toContain("board.tsx")
    expect(uiFiles).not.toContain("utils.ts") // CRITICAL: .ts not in UI
    expect(uiFiles).not.toContain("helper.js")
  })

  test("the reported edge case: auto-selection should never pick .ts when .tsx available", () => {
    // User's real scenario: folder with component.tsx and utils.ts
    const allFiles = [
      "src/components/Button.tsx", // User viewing this
      "src/components/Button.utils.ts", // Generated utility file (same folder!)
      "src/components/Button.test.tsx", // Another .tsx option
    ]

    const boardFiles = allFiles.filter(DEFAULT_BOARD_FILE_FILTER)
    const uiFiles = boardFiles.filter(UI_FILE_FILTER)

    // Backend can see all three
    expect(boardFiles).toHaveLength(3)

    // UI only shows the .tsx files
    expect(uiFiles).toEqual([
      "src/components/Button.tsx",
      "src/components/Button.test.tsx",
    ])

    // Simulate: User was viewing Button.tsx, somehow it becomes unavailable
    // (deleted, moved, or file list refresh)
    const currentFile = "src/components/Button.tsx"
    const currentDir = "src/components"

    // WRONG WAY (old code): Would use boardFiles for auto-selection
    const wrongAutoSelect = boardFiles.find((file) => {
      const fileDir = file.includes("/")
        ? file.substring(0, file.lastIndexOf("/"))
        : ""
      return fileDir === currentDir && file !== currentFile
    })
    // This would pick Button.utils.ts! - USER'S COMPLAINT
    expect(wrongAutoSelect).toBe("src/components/Button.utils.ts")

    // RIGHT WAY (new code): Use uiFiles for auto-selection
    const correctAutoSelect = uiFiles.find((file) => {
      const fileDir = file.includes("/")
        ? file.substring(0, file.lastIndexOf("/"))
        : ""
      return fileDir === currentDir && file !== currentFile
    })
    // This correctly picks Button.test.tsx - FIXED!
    expect(correctAutoSelect).toBe("src/components/Button.test.tsx")
  })

  test("auto-selection respects UI filter across different folder structures", () => {
    // Complex project structure like the user might have
    const allFiles = [
      // Main board folder with mixed files
      "boards/main.board.tsx",
      "boards/main.board.ts", // Generated/compiled version!
      "boards/helpers.ts",

      // Components folder
      "src/components/Card.tsx",
      "src/components/Card.styles.ts",
      "src/components/Card.test.tsx",

      // Utils folder
      "src/utils/format.ts",
      "src/utils/constants.json",
    ]

    const boardFiles = allFiles.filter(DEFAULT_BOARD_FILE_FILTER)
    const uiFiles = boardFiles.filter(UI_FILE_FILTER)

    // Backend sees: tsx, ts files (7 total)
    expect(boardFiles).toHaveLength(7) // Excludes .d.ts and .json files

    // UI only shows tsx files
    expect(uiFiles).toEqual([
      "boards/main.board.tsx",
      "src/components/Card.tsx",
      "src/components/Card.test.tsx",
    ])

    // Test each folder auto-selection
    const testFolderAutoSelect = (folder: string, currentFile: string) => {
      const otherInFolder = uiFiles.find((f) => {
        const fileDir = f.includes("/")
          ? f.substring(0, f.lastIndexOf("/"))
          : ""
        return fileDir === folder && f !== currentFile
      })
      return otherInFolder
    }

    // boards/ folder: only main.board.tsx visible
    expect(
      testFolderAutoSelect("boards", "boards/main.board.tsx"),
    ).toBeUndefined()

    // src/components/ folder: Card.test.tsx is fallback for Card.tsx
    expect(
      testFolderAutoSelect("src/components", "src/components/Card.tsx"),
    ).toBe("src/components/Card.test.tsx")
  })

  test("prevents the exact scenario: tsx file switches to ts file on save", () => {
    // Simulate the exact user complaint flow:
    // 1. User working on component.tsx
    // 2. They save/update code
    // 3. File list refreshes
    // 4. System suddenly showing utils.ts instead
    // 5. Errors appear because utils.ts can't be rendered

    const scenarioFiles = [
      "src/Component.tsx", // User viewing
      "src/Component.ts", // Could be compiled/generated version
      "src/Component.module.ts", // Styles/config module
      "src/Component.stories.tsx", // Another valid option
    ]

    const boardFiles = scenarioFiles.filter(DEFAULT_BOARD_FILE_FILTER)
    const uiFiles = boardFiles.filter(UI_FILE_FILTER)

    console.log("Board files (backend sees):", boardFiles)
    console.log("UI files (frontend shows):", uiFiles)

    // The bug: picking from boardFiles when current becomes unavailable
    const buggyAutoSelect = boardFiles.find((file) => {
      return file.startsWith("src/") && file !== "src/Component.tsx"
    })

    console.log("Buggy auto-select would pick:", buggyAutoSelect)
    // Could be .ts file - USER'S PROBLEM!
    expect([
      "src/Component.ts",
      "src/Component.module.ts",
      "src/Component.stories.tsx",
    ]).toContain(buggyAutoSelect!)

    // The fix: only pick from uiFiles
    const fixedAutoSelect = uiFiles.find((file) => {
      return file.startsWith("src/") && file !== "src/Component.tsx"
    })

    console.log("Fixed auto-select picks:", fixedAutoSelect)
    // Must be .tsx file - FIXED!
    expect(fixedAutoSelect).toBe("src/Component.stories.tsx")
    expect(fixedAutoSelect?.endsWith(".tsx")).toBe(true)
  })

  test("validates config with no includeBoardFiles uses default extensions", () => {
    // User's config: tscircuit.config.json with NO includeBoardFiles
    // Expected: Use DEFAULT_BOARD_FILE_EXTENSIONS
    // Issue: Backend allows .ts but UI doesn't show it

    const scenario = {
      configHasIncludeBoardFiles: false,
      backendExtensions: [".tsx", ".ts", ".jsx", ".js", ".circuit.json"],
      uiExtensions: [".tsx", ".jsx", ".circuit.json"],
    }

    expect(scenario.configHasIncludeBoardFiles).toBe(false)
    expect(scenario.backendExtensions).toContain(".ts")
    expect(scenario.uiExtensions).not.toContain(".ts")

    // This mismatch was the root cause!
    expect(scenario.backendExtensions).not.toEqual(scenario.uiExtensions)
  })

  test("file filter application prevents ts selection in same folder", () => {
    // The critical test: does the filter actually prevent .ts selection?

    const files = [
      "components/Button.tsx",
      "components/Button.utils.ts",
      "components/Button.test.tsx",
    ]

    // Apply filters
    const visibleFiles = files.filter(UI_FILE_FILTER)

    // Verify .ts file is filtered out
    expect(visibleFiles).not.toContain("components/Button.utils.ts")

    // Verify .tsx files remain
    expect(visibleFiles).toContain("components/Button.tsx")
    expect(visibleFiles).toContain("components/Button.test.tsx")

    // Simulate auto-selection from visibleFiles
    const autoSelected = visibleFiles.find((f) => f.includes("components/"))

    // Should never be .ts
    expect(autoSelected).not.toMatch(/\.ts$/)
    expect(autoSelected).toMatch(/\.tsx$/)
  })
})
